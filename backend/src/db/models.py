"""SQLAlchemy models for tree state persistence."""

from datetime import datetime
from sqlalchemy import Integer, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base


class TreeState(Base):
    """
    Stores snapshots of the tree state for undo/redo functionality.

    Each row represents a complete tree state at a point in time.
    The current position is tracked separately to enable undo/redo navigation.
    """

    __tablename__ = "tree_states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # JSON payload of the entire tree (stored as text for simplicity)
    payload: Mapped[str] = mapped_column(Text, nullable=False)

    # Timestamp for ordering and display
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<TreeState(id={self.id}, created_at={self.created_at})>"


class TreeStatePointer(Base):
    """
    Tracks the current position in the undo/redo history.

    Only one row should exist; it points to the current TreeState.id.
    When undoing, we decrement current_state_id to an earlier snapshot.
    When redoing, we increment it (if future states exist).
    """

    __tablename__ = "tree_state_pointer"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)

    # ID of the currently active TreeState
    current_state_id: Mapped[int] = mapped_column(Integer, nullable=True)

    def __repr__(self) -> str:
        return f"<TreeStatePointer(current_state_id={self.current_state_id})>"
