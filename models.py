from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class Ticket(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    ticket_id: str = Field(index=True, unique=True)

    customer_name: str
    customer_email: str
    subject: str
    description: str

    status: str = "Open"

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Note(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    ticket_id: str = Field(index=True)
    note_text: str

    created_at: datetime = Field(default_factory=datetime.utcnow)