import json
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn import metrics 
from sklearn.model_selection import train_test_split 
from sklearn.tree import DecisionTreeClassifier 
#from sklearn.tree import plot_tree
from sklearn.tree import _tree

csv_path = Path(__file__).resolve().parent.parent / "Heart_Disease_Prediction_cleaned.csv"
data = pd.read_csv(csv_path, header=0)


#import seaborn as sns
#sns.pairplot(data, kind="kde")

y = data["Heart Disease"]
X = data.drop("Heart Disease", axis = 1)

#This split is optional we might also use the whole data since it is too small

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=1) # 70% training and 30% test

# Create Decision Tree classifer
  
clf = DecisionTreeClassifier()
clf = clf.fit(X_train,y_train)

#Predict the response for test dataset
y_pred = clf.predict(X_test)

print("Accuracy:",metrics.accuracy_score(y_test, y_pred))


#plt.figure(figsize=(35,20)) # Adjust figure size as needed
#plot_tree(clf, fontsize = 10, filled=True, rounded=True, feature_names=X.columns, class_names=['No Disease', 'Disease'])
#plt.show()



def sk_tree_to_json(decision_tree, feature_names, class_names):
    tree_ = decision_tree.tree_
    feature_name = [
        feature_names[i] if i != _tree.TREE_UNDEFINED else "undefined!"
        for i in tree_.feature
    ]

    def recurse(node, parent_id=None):
        node_json = {
            "node_id": int(node), # Cast to int
            "impurity": float(tree_.impurity[node]), # Cast to float
            "n_node_samples": int(tree_.n_node_samples[node]), # Cast to int
            "value": tree_.value[node].tolist()
        }
        if tree_.feature[node] != _tree.TREE_UNDEFINED:
            node_json["feature"] = feature_name[node]
            node_json["threshold"] = float(tree_.threshold[node]) # Cast to float
            node_json["children"] = []
            node_json["children"].append(recurse(tree_.children_left[node], node))
            node_json["children"].append(recurse(tree_.children_right[node], node))
        else:
            node_json["class"] = class_names[np.argmax(tree_.value[node])] # Use np.argmax
        return node_json

    return recurse(0)

tree_json = sk_tree_to_json(clf, X.columns, ['No Disease', 'Disease'])
#print(json.dumps(tree_json, indent=1))




# ============================================================
#           OWN EDITABLE DECISION TREE IMPLEMENTATION
# ============================================================
#                       BASIC NODE
# ============================================================
class TreeNode:
    def __init__(self, feature=None, threshold=None, left=None, right=None, value=None):
        self.feature = feature      # which feature to split
        self.threshold = threshold  # split threshold
        self.left = left            # left child
        self.right = right          # right child
        self.value = value          # leaf prediction (probabilities)


    def is_leaf(self):
        return self.feature is None

# ============================================================
#                       TREE CLASS
# ============================================================
class Tree:
    def __init__(self, root, n_classes):
        self.root = root
        self.n_classes = n_classes

    # -----------------------------------------
    # Prediction
    # -----------------------------------------
    def predict_one(self, x):
        node = self.root
        while True:
            if node is None:
                raise ValueError("Malformed tree: encountered None while traversing."
                                 " Internal node has missing child.")
            if node.is_leaf():
                break
            if x[node.feature] <= node.threshold:
                node = node.left
            else:
                node = node.right
        return np.argmax(node.value)

    def predict(self, X):
        # Accept pandas DataFrame or numpy array / list
        if isinstance(X, pd.DataFrame):
            arr = X.to_numpy()
        else:
            arr = np.array(X)
        return np.array([self.predict_one(x) for x in arr])

    # -----------------------------------------
    # Update leaves after editing structure
    # -----------------------------------------
    '''
    we do not need to update the leaves 
    reading the structure back and evaluating is engough

    def recompute_leaves(self, X, y):
        leaves = []

        def collect(node):
            if node.is_leaf():
                leaves.append(node)
            else:
                collect(node.left)
                collect(node.right)

        collect(self.root)

        stats = {leaf: [] for leaf in leaves}

        # Accept pandas DataFrame/Series as input
        if isinstance(X, pd.DataFrame):
            X_iter = X.to_numpy()
        else:
            X_iter = np.array(X)

        if isinstance(y, (pd.Series, pd.DataFrame)):
            y_iter = np.array(y).ravel()
        else:
            y_iter = np.array(y)

        for xi, yi in zip(X_iter, y_iter):
            node = self.root
            while not node.is_leaf():
                if xi[node.feature] <= node.threshold:
                    node = node.left
                else:
                    node = node.right
            stats[node].append(yi)

        for leaf, labels in stats.items():
            if len(labels) == 0:
                leaf.value = np.ones(self.n_classes) / self.n_classes
            else:
                counts = np.bincount(labels, minlength=self.n_classes)
                leaf.value = counts / counts.sum()

    # -----------------------------------------
    # Change threshold
    # -----------------------------------------
    def change_threshold(self, node, new_t):
        if node.is_leaf():
            raise ValueError("This node is a leaf, cannot change threshold.")
        node.threshold = new_t

    # -----------------------------------------
    # Find parent of a given node
    # -----------------------------------------
    def _find_parent(self, current, target):
        if current is None or current.is_leaf():
            return None
        if current.left is target or current.right is target:
            return current
        return (self._find_parent(current.left, target) or
                self._find_parent(current.right, target))

    # -----------------------------------------
    # Swap two subtrees
    # -----------------------------------------
    def swap_subtrees(self, a, b):
        pa = self._find_parent(self.root, a)
        pb = self._find_parent(self.root, b)

        if pa is None or pb is None:
            raise ValueError("Swapping root nodes not supported in this simple version.")

        # replace child pointers
        if pa.left is a:
            pa.left = b
        else:
            pa.right = b

        if pb.left is b:
            pb.left = a
        else:
            pb.right = a

    # -----------------------------------------
    # MOVE SUBTREE: detach and re-attach
    # -----------------------------------------
    def move_subtree(self, child, new_parent, side="left"):
        """
        side = "left" or "right"
        """
        old_parent = self._find_parent(self.root, child)

        if old_parent is None:
            raise ValueError("Cannot move the root node.")

        # detach from old parent -- replace detached slot with a leaf
        # to preserve the invariant that every internal node has TreeNode children
        replacement_leaf = TreeNode(value=np.ones(self.n_classes) / self.n_classes)
        if old_parent.left is child:
            old_parent.left = replacement_leaf
        else:
            old_parent.right = replacement_leaf

        # attach to new parent
        if side == "left":
            new_parent.left = child
        else:
            new_parent.right = child
    
    # -----------------------------------------
    # Build editable tree from sklearn classifier
    # -----------------------------------------
    #@staticmethod
    def from_sklearn(clf):
        """
        clf: trained sklearn DecisionTreeClassifier
        """
        sk = clf.tree_
        n_classes = clf.n_classes_

        def build(node_id):
            feature = sk.feature[node_id]
            threshold = sk.threshold[node_id]
            value = sk.value[node_id][0]  # shape (n_classes,)

            # Leaf node?
            if feature == -2:
                prob = value / value.sum() if value.sum() > 0 else np.ones(n_classes)/n_classes
                return TreeNode(value=prob)

            # Internal node
            left_child = build(sk.children_left[node_id])
            right_child = build(sk.children_right[node_id])
            return TreeNode(feature=feature, threshold=threshold,
                            left=left_child, right=right_child)

        root = build(0)
        return Tree(root, n_classes)

'''