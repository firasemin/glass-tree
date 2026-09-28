"""Decision tree generation service."""

import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, _tree

from schemas.tree import TreeNode


# Path to the training data CSV
CSV_PATH = (
    Path(__file__).resolve().parent.parent / "Heart_Disease_Prediction_cleaned.csv"
)


def sk_tree_to_dict(
    decision_tree: DecisionTreeClassifier, feature_names, class_names
) -> dict:
    """Convert a sklearn DecisionTreeClassifier to a JSON-serializable dict matching TreeNode schema."""
    tree_ = decision_tree.tree_
    feature_name = [
        feature_names[i] if i != _tree.TREE_UNDEFINED else "undefined!"
        for i in tree_.feature
    ]

    def recurse(node: int) -> dict:
        node_dict = {
            "node_id": int(node),
            "impurity": float(tree_.impurity[node]),
            "n_node_samples": int(tree_.n_node_samples[node]),
            "value": tree_.value[node].tolist(),
        }
        if tree_.feature[node] != _tree.TREE_UNDEFINED:
            # Internal node
            node_dict["feature"] = feature_name[node]
            node_dict["threshold"] = float(tree_.threshold[node])
            node_dict["children"] = [
                recurse(tree_.children_left[node]),
                recurse(tree_.children_right[node]),
            ]
        else:
            # Leaf node
            node_dict["class"] = class_names[np.argmax(tree_.value[node])]
        return node_dict

    return recurse(0)


def train_decision_tree(random_state: int = 1, test_size: float = 0.3) -> dict:
    """
    Train a DecisionTreeClassifier on the heart disease dataset and return the tree as a dict.

    Args:
        random_state: Random seed for reproducibility.
        test_size: Fraction of data to use for testing.

    Returns:
        Dictionary representation of the decision tree matching TreeNode schema.
    """
    data = pd.read_csv(CSV_PATH, header=0)

    y = data["Heart Disease"]
    X = data.drop("Heart Disease", axis=1)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )

    clf = DecisionTreeClassifier()
    clf.fit(X_train, y_train)

    tree_dict = sk_tree_to_dict(clf, X.columns.tolist(), ["No Disease", "Disease"])
    return tree_dict


def get_trained_tree() -> TreeNode:
    """Get the trained decision tree as a validated TreeNode."""
    tree_dict = train_decision_tree()
    return TreeNode.model_validate(tree_dict)
