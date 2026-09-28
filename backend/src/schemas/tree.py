"""Tree-related Pydantic models shared across services."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict

# For the Histogram Feature
class HistogramBin(BaseModel):
    """A single bin in a histogram distribution."""
    bin_start: float
    bin_end: float
    count: int


class TreeNode(BaseModel):
    """Recursive decision tree node matching frontend expectations."""

    node_id: int
    impurity: float
    n_node_samples: int
    value: List[List[float]]
    feature: Optional[str] = None
    threshold: Optional[float] = None
    class_label: Optional[str] = Field(default=None, alias="class")
    children: List["TreeNode"] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True, protected_namespaces=())
