'''Tree evaluation service, builds the tree as a custom class from the JSON schema'''

from pathlib import Path
from typing import Dict, Any

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn import metrics

from schemas.tree import TreeNode as SchemaTreeNode


class EvalError(RuntimeError):
    pass

'''represent node internally'''
class TreeNode:
    def __init__(self, feature=None, threshold=None, left=None, right=None, value=None):
        self.feature = feature
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value

    def is_leaf(self):
        return self.feature is None


class Tree:
    def __init__(self, root: TreeNode, n_classes: int, feature_names: list):
        self.root = root
        self.n_classes = n_classes
        self.feature_names = list(feature_names)

    def predict_one(self, x):
        node = self.root
        while True:
            if node is None:
                raise EvalError("Malformed tree: encountered None while traversing")
            if node.is_leaf():
                break
            # feature is index
            if(node.left is None and node.right is not None):
                node = node.right
                continue
            if(node.right is None and node.left is not None):
                node = node.left
                continue

            if x[node.feature] <= node.threshold:
                node = node.left
            else:
                node = node.right
        return int(np.argmax(node.value))

    def predict(self, X):
        if isinstance(X, pd.DataFrame):
            arr = X.to_numpy()
        else:
            arr = np.array(X)
        return np.array([self.predict_one(x) for x in arr])


def _load_dataset():
    csv_path = Path(__file__).resolve().parent.parent / "Heart_Disease_Prediction_cleaned.csv"
    df = pd.read_csv(csv_path)
    y = df["Heart Disease"].to_numpy().ravel()
    X = df.drop("Heart Disease", axis=1)
    return X, y


def _schema_to_tree(node_schema: SchemaTreeNode, feature_names: list) -> TreeNode:
    # node_schema.feature is either feature name or None
    if node_schema.feature is None:
        # leaf
        v = node_schema.value
        # value is nested list e.g. [[0.3, 0.7]] or [ [count...] ]
        if isinstance(v, list) and len(v) > 0 and isinstance(v[0], list):
            arr = np.array(v[0], dtype=float)
        else:
            arr = np.array(v, dtype=float)
        return TreeNode(value=arr)

    # internal node: map feature name to index
    try:
        feat_index = list(feature_names).index(node_schema.feature)
    except ValueError:
        raise EvalError(f"Feature '{node_schema.feature}' not found in dataset columns")

    if len(node_schema.children) == 2:
        #raise EvalError(f"'Feature: {node_schema.feature}' with id: {node_schema.node_id}. Internal node must have exactly two children (left, right)")

        left = _schema_to_tree(node_schema.children[0], feature_names)
        right = _schema_to_tree(node_schema.children[1], feature_names)
    elif len(node_schema.children) == 1:
        # only one child, assume left
        left = _schema_to_tree(node_schema.children[0], feature_names)
        right = None
    else:
        raise EvalError(f"Internal node must have at least one child")
    
    return TreeNode(feature=feat_index, threshold=node_schema.threshold, left=left, right=right)


def build_tree_from_schema(tree_dict: Dict[str, Any]):
    schema = SchemaTreeNode.model_validate(tree_dict)
    X, y = _load_dataset()
    n_classes = len(np.unique(y))
    root = _schema_to_tree(schema, X.columns)
    if root is None : 
        raise EvalError(f"Cannot build tree with {n_classes} classes and features: {X.columns.tolist()}")
    return Tree(root, n_classes, feature_names=X.columns)


def evaluate_tree(tree_dict: Dict[str, Any]):
    """Build a Tree from frontend JSON and evaluate on held-out data.

    Returns a dict with accuracy and confusion matrix and basic metrics.
    """
    tree = build_tree_from_schema(tree_dict)
    X, y = _load_dataset()

    y_pred = tree.predict(X)
    acc = float(metrics.accuracy_score(y, y_pred))
    cm = metrics.confusion_matrix(y, y_pred).tolist()
    report = metrics.classification_report(y, y_pred, output_dict=True)

    return {
        "accuracy": acc,
        "confusion_matrix": cm,
        "report": report,
        "n_test_samples": int(len(y)),
    }
