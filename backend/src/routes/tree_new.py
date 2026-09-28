"""Tree endpoints with undo/redo persistence."""

from typing import Any, Dict, Optional, List


from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from schemas.tree import TreeNode
from services.tree_state_service import (
    get_current_tree_state,
    save_tree_state,
    undo_tree_state,
    redo_tree_state,
    get_history_info,
    reset_to_initial,
    fetch_initial_tree_from_microservice,
)
from services.tree_eval_service import evaluate_tree, EvalError

from db.models import TreeState
from decisionTree import X
from schemas.tree import HistogramBin
import numpy as np

# Helper to find path to node
def find_node_path(node: Dict[str, Any], target_id: int, current_path: list = None) -> Optional[list]:
    if current_path is None:
        current_path = []
    
    if node.get("node_id") == target_id:
        return current_path
    
    children = node.get("children", [])
    if not children:
        return None
        
    feature = node.get("feature")
    threshold = node.get("threshold")
    
    if feature is None or threshold is None:
        return None

    # Try left child (<= threshold)
    left_path = current_path + [{"feature": feature, "threshold": threshold, "op": "le"}]
    res = find_node_path(children[0], target_id, left_path)
    if res is not None:
        return res
        
    # Try right child (> threshold)
    if len(children) > 1:
        right_path = current_path + [{"feature": feature, "threshold": threshold, "op": "gt"}]
        res = find_node_path(children[1], target_id, right_path)
        if res is not None:
            return res
            
    return None

def get_node_samples(tree_dict: Dict[str, Any], node_id: int):
    path = find_node_path(tree_dict, node_id)
    if path is None:
        return None
        
    # Filter X
    filtered_X = X.copy()
    for constraint in path:
        feat = constraint["feature"]
        thresh = constraint["threshold"]
        op = constraint["op"]
        
        if op == "le":
            filtered_X = filtered_X[filtered_X[feat] <= thresh]
        else:
            filtered_X = filtered_X[filtered_X[feat] > thresh]
            
    return filtered_X


router = APIRouter(prefix="/tree", tags=["Tree"])


class HistoryInfo(BaseModel):
    """Response model for history status."""

    can_undo: bool
    can_redo: bool
    total_states: int
    current_position: int


class SaveRequest(BaseModel):
    """Request model for saving tree state."""

    tree: Dict[str, Any]


class EvaluateRequest(BaseModel):
    """Request model for evaluating a tree from the frontend."""

    tree: Dict[str, Any]


class EvaluateResponse(BaseModel):
    accuracy: float
    confusion_matrix: List[List[int]]
    report: Dict[str, Any]
    n_test_samples: int


@router.get("/features", response_model=List[str]) 
async def get_dataset_features(): 
    """
    Get all available features form the Dataset 
    """
    return X.columns.tolist()

@router.get("/", response_model=TreeNode)
async def get_tree(db: AsyncSession = Depends(get_db)) -> TreeNode:
    """
    Get the current tree state.

    If no state exists in the database, fetches and saves the initial
    tree from the microservice.
    """
    tree_data = await get_current_tree_state(db)

    if tree_data is None:
        # No saved state, fetch from microservice and save
        try:
            tree_data = await fetch_initial_tree_from_microservice()
            await save_tree_state(db, tree_data)
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Could not fetch initial tree from microservice: {str(e)}",
            )

    return TreeNode.model_validate(tree_data)


@router.post("/save", response_model=TreeNode)
async def save_tree(
    request: SaveRequest, db: AsyncSession = Depends(get_db)
) -> TreeNode:
    """
    Save a new tree state snapshot.

    This creates a new entry in the history. If called after undo operations,
    it truncates any 'redo' states (creating a new branch).
    """
    tree_node = TreeNode.model_validate(request.tree)
    await save_tree_state(db, request.tree)
    return tree_node


@router.post("/undo", response_model=TreeNode)
async def undo(db: AsyncSession = Depends(get_db)) -> TreeNode:
    """
    Undo to the previous tree state.

    Returns 400 if already at the beginning of history.
    """
    tree_data = await undo_tree_state(db)

    if tree_data is None:
        raise HTTPException(status_code=400, detail="Nothing to undo")

    return TreeNode.model_validate(tree_data)


@router.post("/redo", response_model=TreeNode)
async def redo(db: AsyncSession = Depends(get_db)) -> TreeNode:
    """
    Redo to the next tree state.

    Returns 400 if already at the end of history.
    """
    tree_data = await redo_tree_state(db)

    if tree_data is None:
        raise HTTPException(status_code=400, detail="Nothing to redo")

    return TreeNode.model_validate(tree_data)


@router.get("/history", response_model=HistoryInfo)
async def history(db: AsyncSession = Depends(get_db)) -> HistoryInfo:
    """Get information about the current undo/redo history."""
    info = await get_history_info(db)
    return HistoryInfo(**info)


@router.post("/reset", response_model=TreeNode)
async def reset(db: AsyncSession = Depends(get_db)) -> TreeNode:
    """
    Reset to a fresh tree from the microservice.

    This clears all history and fetches a new initial tree.
    """
    try:
        tree_data = await reset_to_initial(db)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Could not reset tree: {str(e)}")

    return TreeNode.model_validate(tree_data)


@router.get("/node/{node_id}/feature/{feature_name}/distribution", response_model=list[HistogramBin])
async def get_feature_distribution(
    node_id: int, 
    feature_name: str,
    db: AsyncSession = Depends(get_db)
) -> list[HistogramBin]:
    """
    Get the distribution of a specific feature for samples falling into a specific node.
    """
    # 1. Get current tree
    tree_data = await get_current_tree_state(db)
    if not tree_data:
        # If no state, try to fetch initial
        try:
            tree_data = await fetch_initial_tree_from_microservice()
            await save_tree_state(db, tree_data)
        except:
             raise HTTPException(status_code=404, detail="Tree not found")

    # 2. Find samples in this node
    samples = get_node_samples(tree_data, node_id)
    if samples is None:
        raise HTTPException(status_code=404, detail="Node not found in current tree")
        
    if samples.empty:
         return []
         
    if feature_name not in samples.columns:
        raise HTTPException(status_code=400, detail=f"Feature '{feature_name}' not found in dataset")
        
    # 3. Compute Histogram
    # Use numpy to compute histogram
    try:
        data_values = samples[feature_name].dropna()
        if data_values.empty:
            return []
            
        # Determine bins - heuristic: 10 bins or sqrt(n)
        counts, bin_edges = np.histogram(data_values, bins=10)
        
        result = []
        for i in range(len(counts)):
            result.append(HistogramBin(
                bin_start=float(bin_edges[i]),
                bin_end=float(bin_edges[i+1]),
                count=int(counts[i])
            ))
            
        return result
        
    except Exception as e:
        print(f"Error computing histogram: {e}")
        raise HTTPException(status_code=500, detail="Error computing histogram")

from services.tree_flow_service import reflow_tree

@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_tree_endpoint(request: EvaluateRequest) -> EvaluateResponse:
    """Evaluate a tree (sent from the frontend) and return accuracy & metrics."""
    try:
        res = evaluate_tree(request.tree)
    except EvalError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

    return EvaluateResponse(**res)


@router.post("/reflow", response_model=TreeNode)
async def reflow_tree_endpoint(request: SaveRequest) -> TreeNode:
    """
    Recalculate sample counts and values for the provided tree
    based on the current dataset. Returns the updated tree.
    """
    try:
        updated_tree = reflow_tree(request.tree)
        return TreeNode.model_validate(updated_tree)
    except Exception as e:
        print(f"Reflow error: {e}")
        raise HTTPException(status_code=500, detail=f"Reflow failed: {str(e)}")
