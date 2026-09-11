from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select

from database import create_db_and_tables, get_session
from models import Ticket, Note
from schemas import TicketCreate, TicketUpdate


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="Customer Support CRM",
    description="Datastraw Technologies Assessment",
    version="1.0.0",
    lifespan=lifespan
)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def home():
    return FileResponse("templates/index.html")


@app.post("/api/tickets")
def create_ticket(
    ticket_data: TicketCreate,
    session: Session = Depends(get_session)
):
    last_ticket = session.exec(
        select(Ticket).order_by(Ticket.id.desc())
    ).first()

    if last_ticket:
        next_number = last_ticket.id + 1
    else:
        next_number = 1

    ticket_id = f"TKT-{next_number:03d}"

    ticket = Ticket(
        ticket_id=ticket_id,
        customer_name=ticket_data.customer_name,
        customer_email=ticket_data.customer_email,
        subject=ticket_data.subject,
        description=ticket_data.description,
        status="Open",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    session.add(ticket)
    session.commit()
    session.refresh(ticket)

    return {
        "ticket_id": ticket.ticket_id,
        "created_at": ticket.created_at
    }


@app.get("/api/tickets")
def get_tickets(
    status: str | None = None,
    search: str | None = None,
    session: Session = Depends(get_session)
):
    query = select(Ticket)

    if status and status != "All":
        query = query.where(Ticket.status == status)

    tickets = session.exec(
        query.order_by(Ticket.id.desc())
    ).all()

    if search:
        search_lower = search.lower()

        tickets = [
            ticket
            for ticket in tickets
            if (
                search_lower in ticket.customer_name.lower()
                or search_lower in ticket.customer_email.lower()
                or search_lower in ticket.ticket_id.lower()
                or search_lower in ticket.description.lower()
            )
        ]

    return [
        {
            "ticket_id": ticket.ticket_id,
            "customer_name": ticket.customer_name,
            "subject": ticket.subject,
            "status": ticket.status,
            "created_at": ticket.created_at
        }
        for ticket in tickets
    ]


@app.get("/api/tickets/{ticket_id}")
def get_ticket(
    ticket_id: str,
    session: Session = Depends(get_session)
):
    ticket = session.exec(
        select(Ticket).where(Ticket.ticket_id == ticket_id)
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    notes = session.exec(
        select(Note)
        .where(Note.ticket_id == ticket_id)
        .order_by(Note.id.asc())
    ).all()

    return {
        "ticket_id": ticket.ticket_id,
        "customer_name": ticket.customer_name,
        "customer_email": ticket.customer_email,
        "subject": ticket.subject,
        "description": ticket.description,
        "status": ticket.status,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
        "notes": [
            {
                "id": note.id,
                "note_text": note.note_text,
                "created_at": note.created_at
            }
            for note in notes
        ]
    }


@app.put("/api/tickets/{ticket_id}")
def update_ticket(
    ticket_id: str,
    update_data: TicketUpdate,
    session: Session = Depends(get_session)
):
    allowed_statuses = [
        "Open",
        "In Progress",
        "Closed"
    ]

    if update_data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    ticket = session.exec(
        select(Ticket).where(Ticket.ticket_id == ticket_id)
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    ticket.status = update_data.status
    ticket.updated_at = datetime.utcnow()

    session.add(ticket)

    if update_data.notes and update_data.notes.strip():
        note = Note(
            ticket_id=ticket_id,
            note_text=update_data.notes.strip(),
            created_at=datetime.utcnow()
        )

        session.add(note)

    session.commit()

    return {
        "success": True,
        "updated_at": ticket.updated_at
    }