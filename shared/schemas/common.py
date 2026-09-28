"""Common Pydantic models shared across services."""

from typing import Optional

from pydantic import BaseModel


class TestData(BaseModel):
    """Dummy test data model."""

    some_text: Optional[str] = None
    random_number: Optional[str] = None
