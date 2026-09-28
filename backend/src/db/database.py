"""Database configuration and session management."""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase


# Support both DATABASE_URL (docker-compose) and POSTGRES_URL (Helm/CI)
# DATABASE_URL may already have +asyncpg, POSTGRES_URL needs conversion
_raw_url = os.getenv("DATABASE_URL") or os.getenv(
    "POSTGRES_URL", "postgresql://postgres:postgres@localhost:5432/tree_db"
)

# SQLAlchemy async requires the +asyncpg driver in the URL
# Only add it if not already present
if "+asyncpg" not in _raw_url:
    DATABASE_URL = _raw_url.replace("postgresql://", "postgresql+asyncpg://")
else:
    DATABASE_URL = _raw_url

engine = create_async_engine(DATABASE_URL, echo=False)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """SQLAlchemy declarative base for all models."""

    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency for database sessions."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
