"""Tree state persistence service for undo/redo functionality."""

import json
import os
from typing import Optional

import httpx
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import TreeState, TreeStatePointer


MICROSERVICE_URL = os.getenv("MICROSERVICE_URL", "http://localhost:8081")


async def get_or_create_pointer(db: AsyncSession) -> TreeStatePointer:
    """Get the singleton pointer row, creating it if needed."""
    result = await db.execute(select(TreeStatePointer).where(TreeStatePointer.id == 1))
    pointer = result.scalar_one_or_none()

    if pointer is None:
        pointer = TreeStatePointer(id=1, current_state_id=None)
        db.add(pointer)
        await db.commit()
        await db.refresh(pointer)

    return pointer


async def fetch_initial_tree_from_microservice() -> dict:
    """Fetch the initial trained tree from the microservice."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{MICROSERVICE_URL}/v1/tree/")
        response.raise_for_status()
        return response.json()


async def save_tree_state(db: AsyncSession, tree_data: dict) -> TreeState:
    """
    Save a new tree state snapshot.

    When saving after undo operations, this truncates any 'future' states
    that would have been reached via redo, creating a new branch.
    """
    pointer = await get_or_create_pointer(db)

    # If we have a current state and there are newer states, delete them (branching)
    if pointer.current_state_id is not None:
        await db.execute(
            TreeState.__table__.delete().where(TreeState.id > pointer.current_state_id)
        )

    # Create new state
    new_state = TreeState(payload=json.dumps(tree_data))
    db.add(new_state)
    await db.commit()
    await db.refresh(new_state)

    # Update pointer to new state
    pointer.current_state_id = new_state.id
    await db.commit()

    return new_state


async def get_current_tree_state(db: AsyncSession) -> Optional[dict]:
    """Get the current tree state, or None if no states exist."""
    pointer = await get_or_create_pointer(db)

    if pointer.current_state_id is None:
        return None

    result = await db.execute(
        select(TreeState).where(TreeState.id == pointer.current_state_id)
    )
    state = result.scalar_one_or_none()

    if state is None:
        return None

    return json.loads(state.payload)


async def undo_tree_state(db: AsyncSession) -> Optional[dict]:
    """
    Move to the previous state (undo).

    Returns the previous state's tree data, or None if at the beginning.
    """
    pointer = await get_or_create_pointer(db)

    if pointer.current_state_id is None:
        return None

    # Find the state before current
    result = await db.execute(
        select(TreeState)
        .where(TreeState.id < pointer.current_state_id)
        .order_by(desc(TreeState.id))
        .limit(1)
    )
    prev_state = result.scalar_one_or_none()

    if prev_state is None:
        return None  # Already at the beginning

    # Update pointer
    pointer.current_state_id = prev_state.id
    await db.commit()

    return json.loads(prev_state.payload)


async def redo_tree_state(db: AsyncSession) -> Optional[dict]:
    """
    Move to the next state (redo).

    Returns the next state's tree data, or None if at the end.
    """
    pointer = await get_or_create_pointer(db)

    if pointer.current_state_id is None:
        return None

    # Find the state after current
    result = await db.execute(
        select(TreeState)
        .where(TreeState.id > pointer.current_state_id)
        .order_by(TreeState.id)
        .limit(1)
    )
    next_state = result.scalar_one_or_none()

    if next_state is None:
        return None  # Already at the end

    # Update pointer
    pointer.current_state_id = next_state.id
    await db.commit()

    return json.loads(next_state.payload)


async def get_history_info(db: AsyncSession) -> dict:
    """Get info about undo/redo availability."""
    pointer = await get_or_create_pointer(db)

    if pointer.current_state_id is None:
        return {
            "can_undo": False,
            "can_redo": False,
            "total_states": 0,
            "current_position": 0,
        }

    # Count states before current (can undo)
    result = await db.execute(
        select(TreeState.id).where(TreeState.id < pointer.current_state_id)
    )
    states_before = len(result.all())

    # Count states after current (can redo)
    result = await db.execute(
        select(TreeState.id).where(TreeState.id > pointer.current_state_id)
    )
    states_after = len(result.all())

    # Total states
    result = await db.execute(select(TreeState.id))
    total = len(result.all())

    return {
        "can_undo": states_before > 0,
        "can_redo": states_after > 0,
        "total_states": total,
        "current_position": states_before + 1,
    }


async def reset_to_initial(db: AsyncSession) -> dict:
    """Reset to a fresh tree from the microservice, clearing all history."""
    # Clear all states
    await db.execute(TreeState.__table__.delete())

    # Reset pointer
    pointer = await get_or_create_pointer(db)
    pointer.current_state_id = None
    await db.commit()

    # Fetch and save initial tree
    tree_data = await fetch_initial_tree_from_microservice()
    await save_tree_state(db, tree_data)

    return tree_data
