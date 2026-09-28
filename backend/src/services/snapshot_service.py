"""Service for managing tree snapshots."""

import json
from typing import Dict, Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import TreeSnapshot


async def create_snapshot(
    db: AsyncSession,
    name: str,
    tree: Dict[str, Any],
    accuracy: Optional[float] = None,
    notes: str = "",
) -> TreeSnapshot:
    """Create and save a new tree snapshot, returns the created snapshot."""
    payload = json.dumps(tree)
    snapshot = TreeSnapshot(
        name=name,
        notes=notes[:400],  # enforce 400 char limit
        payload=payload,
        accuracy=accuracy,
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return snapshot


async def get_snapshot(db: AsyncSession, snapshot_id: int) -> Optional[TreeSnapshot]:
    """Fetch a snapshot by ID."""
    result = await db.execute(
        select(TreeSnapshot).where(TreeSnapshot.id == snapshot_id)
    )
    return result.scalar_one_or_none()


async def list_snapshots(db: AsyncSession, limit: int = 100) -> list[TreeSnapshot]:
    """List all snapshots, newest first."""
    result = await db.execute(
        select(TreeSnapshot).order_by(TreeSnapshot.created_at.desc()).limit(limit)
    )
    return result.scalars().all()


async def update_snapshot(
    db: AsyncSession,
    snapshot_id: int,
    name: Optional[str] = None,
    notes: Optional[str] = None,
) -> Optional[TreeSnapshot]:
    """Update a snapshot's name and notes."""
    snapshot = await get_snapshot(db, snapshot_id)
    if not snapshot:
        return None
    if name is not None:
        snapshot.name = name
    if notes is not None:
        snapshot.notes = notes[:400]  # enforce 400 char limit
    await db.commit()
    await db.refresh(snapshot)
    return snapshot


async def delete_snapshot(db: AsyncSession, snapshot_id: int) -> bool:
    """Delete a snapshot. Returns True if deleted, False if not found."""
    snapshot = await get_snapshot(db, snapshot_id)
    if not snapshot:
        return False
    await db.delete(snapshot)
    await db.commit()
    return True


async def delete_all_snapshots(db: AsyncSession) -> int:
    """Delete all snapshots. Returns the number of rows deleted (or -1 if unknown)."""
    from sqlalchemy import delete as sa_delete

    res = await db.execute(sa_delete(TreeSnapshot))
    # rowcount may be driver-dependent
    rowcount = getattr(res, 'rowcount', -1) or -1
    await db.commit()
    return rowcount
