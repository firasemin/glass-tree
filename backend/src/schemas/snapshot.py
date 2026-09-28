"""Pydantic schemas for tree snapshot endpoints."""

from datetime import datetime
from typing import Dict, Any

from pydantic import BaseModel, Field


class TreeSnapshotCreate(BaseModel):
    """Request to create a new tree snapshot."""

    name: str = Field(..., min_length=1, max_length=255)
    notes: str = Field(default="", max_length=400)
    tree: Dict[str, Any]
    accuracy: float | None = None


class TreeSnapshotResponse(BaseModel):
    """Response when fetching a tree snapshot."""

    id: int
    name: str
    notes: str | None
    tree: Dict[str, Any]
    accuracy: float | None
    created_at: datetime

    class Config:
        from_attributes = True
