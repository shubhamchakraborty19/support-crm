const API_URL = "/api/tickets";


// Load tickets when page opens
document.addEventListener("DOMContentLoaded", () => {
    loadTickets();
});


// Load ticket list
async function loadTickets() {

    const search = document.getElementById("searchInput").value;
    const status = document.getElementById("statusFilter").value;

    let url = `${API_URL}?`;

    if (search) {
        url += `search=${encodeURIComponent(search)}&`;
    }

    if (status) {
        url += `status=${encodeURIComponent(status)}`;
    }

    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Failed to load tickets");
        }

        const tickets = await response.json();

        displayTickets(tickets);
        updateStats(tickets);

    } catch (error) {

        console.error(error);

        document.getElementById("ticketList").innerHTML =
            `<p class="loading">Unable to load tickets.</p>`;
    }
}


// Display tickets
function displayTickets(tickets) {

    const ticketList = document.getElementById("ticketList");

    if (tickets.length === 0) {

        ticketList.innerHTML =
            `<p class="loading">No tickets found.</p>`;

        return;
    }

    ticketList.innerHTML = tickets.map(ticket => {

        let statusClass = "status-open";

        if (ticket.status === "In Progress") {
            statusClass = "status-progress";
        }

        if (ticket.status === "Closed") {
            statusClass = "status-closed";
        }

        return `
            <div class="ticket-card"
                 onclick="openTicket('${ticket.ticket_id}')">

                <div class="ticket-info">

                    <div class="ticket-id">
                        ${ticket.ticket_id}
                    </div>

                    <h3>${escapeHtml(ticket.subject)}</h3>

                    <p>
                        ${escapeHtml(ticket.customer_name)}
                    </p>

                </div>

                <span class="status ${statusClass}">
                    ${ticket.status}
                </span>

            </div>
        `;

    }).join("");
}


// Update dashboard statistics
function updateStats(tickets) {

    document.getElementById("totalTickets").textContent =
        tickets.length;

    document.getElementById("openTickets").textContent =
        tickets.filter(t => t.status === "Open").length;

    document.getElementById("progressTickets").textContent =
        tickets.filter(t => t.status === "In Progress").length;

    document.getElementById("closedTickets").textContent =
        tickets.filter(t => t.status === "Closed").length;
}


// Open create ticket modal
function openCreateTicket() {

    document.getElementById("createModal").style.display =
        "flex";
}


// Close create ticket modal
function closeCreateTicket() {

    document.getElementById("createModal").style.display =
        "none";
}


// Create ticket
document.getElementById("ticketForm").addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const ticket = {

            customer_name:
                document.getElementById("customerName").value,

            customer_email:
                document.getElementById("customerEmail").value,

            subject:
                document.getElementById("subject").value,

            description:
                document.getElementById("description").value
        };


        try {

            const response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(ticket)
            });


            const data = await response.json();


            if (!response.ok) {

                alert(data.detail || "Failed to create ticket");

                return;
            }


            alert(`Ticket ${data.ticket_id} created successfully!`);


            document.getElementById("ticketForm").reset();

            closeCreateTicket();

            loadTickets();


        } catch (error) {

            console.error(error);

            alert("Something went wrong.");
        }

    }
);


// Open ticket details
async function openTicket(ticketId) {

    try {

        const response =
            await fetch(`${API_URL}/${ticketId}`);

        const ticket =
            await response.json();


        if (!response.ok) {

            alert(ticket.detail || "Ticket not found");

            return;
        }


        let notesHTML = "";

        if (ticket.notes.length > 0) {

            notesHTML = ticket.notes.map(note => `
                <div class="note">
                    ${escapeHtml(note.note_text)}
                </div>
            `).join("");

        } else {

            notesHTML =
                `<p>No notes added yet.</p>`;
        }


        document.getElementById("ticketDetails").innerHTML = `

            <div class="detail-row">
                <strong>Ticket ID</strong>
                ${ticket.ticket_id}
            </div>

            <div class="detail-row">
                <strong>Customer</strong>
                ${escapeHtml(ticket.customer_name)}
            </div>

            <div class="detail-row">
                <strong>Email</strong>
                ${escapeHtml(ticket.customer_email)}
            </div>

            <div class="detail-row">
                <strong>Subject</strong>
                ${escapeHtml(ticket.subject)}
            </div>

            <div class="detail-row">
                <strong>Description</strong>
                ${escapeHtml(ticket.description)}
            </div>

            <div class="detail-row">
                <strong>Status</strong>

                <select id="updateStatus">

                    <option value="Open"
                        ${ticket.status === "Open" ? "selected" : ""}>
                        Open
                    </option>

                    <option value="In Progress"
                        ${ticket.status === "In Progress" ? "selected" : ""}>
                        In Progress
                    </option>

                    <option value="Closed"
                        ${ticket.status === "Closed" ? "selected" : ""}>
                        Closed
                    </option>

                </select>

            </div>

            <div class="detail-row">

                <strong>Notes</strong>

                ${notesHTML}

            </div>

            <div class="detail-row">

                <strong>Add Note</strong>

                <textarea
                    id="newNote"
                    rows="3"
                    placeholder="Write an internal support note..."
                ></textarea>

            </div>

            <button
                class="primary-btn"
                onclick="updateTicket('${ticket.ticket_id}')">
                Save Changes
            </button>
        `;


        document.getElementById("detailsModal").style.display =
            "flex";


    } catch (error) {

        console.error(error);

        alert("Unable to load ticket.");
    }
}


// Update ticket
async function updateTicket(ticketId) {

    const status =
        document.getElementById("updateStatus").value;

    const notes =
        document.getElementById("newNote").value;


    try {

        const response = await fetch(
            `${API_URL}/${ticketId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: status,
                    notes: notes
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            alert(data.detail || "Update failed");

            return;
        }


        alert("Ticket updated successfully!");

        closeDetails();

        loadTickets();


    } catch (error) {

        console.error(error);

        alert("Unable to update ticket.");
    }
}


// Close details modal
function closeDetails() {

    document.getElementById("detailsModal").style.display =
        "none";
}


// Basic HTML escaping
function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}