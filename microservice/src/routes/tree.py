"""Tree generation endpoints for the microservice."""

from fastapi import APIRouter
from fastapi_versioning import version

from schemas.tree import TreeNode
from services.tree_service import get_trained_tree, train_decision_tree

router = APIRouter(prefix="/tree", tags=["Tree"])


@router.get("/", response_model=TreeNode)
@version(1)
async def get_tree() -> TreeNode:
    """
    Generate and return a decision tree trained on the heart disease dataset.

    Returns a TreeNode structure matching the frontend's expected format.
    """
    return get_trained_tree()


@router.post("/train", response_model=TreeNode)
@version(1)
async def retrain_tree(random_state: int = 1, test_size: float = 0.3) -> TreeNode:
    """
    Retrain the decision tree with custom parameters.

    Args:
        random_state: Random seed for reproducibility.
        test_size: Fraction of data to use for testing (0.0-1.0).

    Returns a freshly trained TreeNode structure.
    """
    tree_dict = train_decision_tree(random_state=random_state, test_size=test_size)
    return TreeNode.model_validate(tree_dict)
