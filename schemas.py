from pydantic import BaseModel, EmailStr

class TicketCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    subject: str
    description: str

class TicketUpdate(BaseModel):
    status: str
    notes: str | None = None
