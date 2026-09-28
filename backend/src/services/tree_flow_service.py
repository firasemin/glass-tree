
from pathlib import Path
from typing import Dict, Any, List
import pandas as pd
import numpy as np

from schemas.tree import TreeNode

def _load_dataset():
    # Helper duplicated from eval service to avoid circular deps if any
    # Assuming the CSV is in the parent of src (or similar location based on eval service)
    # tree_eval_service says: Path(__file__).resolve().parent.parent / "Heart_Disease_Prediction_cleaned.csv"
    # That means backend/Heart_Disease_Prediction_cleaned.csv
    csv_path = Path(__file__).resolve().parent.parent.parent / "Heart_Disease_Prediction_cleaned.csv"
    if not csv_path.exists():
         # Fallback try relative
         csv_path = Path("Heart_Disease_Prediction_cleaned.csv")
    
    df = pd.read_csv(csv_path)
    # Ensure all columns are present that might be used
    return df

def reflow_tree(tree_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recalculates n_node_samples and value/class distributions for the entire tree
    based on the current dataset.
    """
    df = _load_dataset()
    
    # We recursively traverse the dictionary, filtering the dataframe as we go
    updated_tree = _recurse_flow(tree_dict, df)
    return updated_tree

def _recurse_flow(node: Dict[str, Any], data: pd.DataFrame) -> Dict[str, Any]:
    # Update stats for this node
    n_samples = len(data)
    node["n_node_samples"] = n_samples
    
    # Update value distribution (target is "Heart Disease")
    # Value format is [[count_class_0, count_class_1]] usually for sklearn trees
    if "Heart Disease" in data.columns:
        counts = data["Heart Disease"].value_counts().sort_index()
        # Ensure we have counts for 0 and 1
        c0 = counts.get(0, 0)
        c1 = counts.get(1, 0)
        node["value"] = [[float(c0), float(c1)]]
        
        # Calculate impurity (Gini)
        if n_samples > 0:
            p0 = c0 / n_samples
            p1 = c1 / n_samples
            gini = 1.0 - (p0**2 + p1**2)
            node["impurity"] = round(gini, 4)
        else:
            node["impurity"] = 0.0
    
    children = node.get("children", [])
    if not children:
        # Leaf node
        # Update predicted class if needed
        # node["class"] = ... (optional if frontend uses it)
        return node
    
    # Internal node: filter data for children
    feature = node.get("feature")
    threshold = node.get("threshold")
    
    if feature and threshold is not None:
        # We assume binary split: left <= threshold, right > threshold
        # IMPORTANT: The matching with frontend is key.
        # usually 0 is left (<=), 1 is right (>) 
        
        # Split data
        if feature in data.columns:
            left_data = data[data[feature] <= threshold]
            right_data = data[data[feature] > threshold]
        else:
            # Feature somehow changed or invalid?
            left_data = pd.DataFrame(columns=data.columns)
            right_data = pd.DataFrame(columns=data.columns)
            
        new_children = []
        # Process left child
        if len(children) > 0:
            new_children.append(_recurse_flow(children[0], left_data))
        
        # Process right child
        if len(children) > 1:
            new_children.append(_recurse_flow(children[1], right_data))
            
        node["children"] = new_children
        
    return node
