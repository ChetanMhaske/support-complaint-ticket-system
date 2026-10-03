# Support / Complaint Ticket System

Full Stack Developer Assignment 5 — Support & Complaint Ticket Management System with controlled status transitions.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (with PGlite fallback for zero-configuration testing)

---

## Features
- **Ticket Creation:** Form with validation (Title, Category, Priority, Description). New tickets default to `Open`.
- **Listing & Filters:** Filter tickets by Status (`Open`, `In Progress`, `Resolved`) and Priority (`Low`, `Medium`, `High`), plus text search.
- **Controlled Status Workflow:** Strict transition progression (`Open` ➔ `In Progress` ➔ `Resolved`). Invalid transitions are blocked on both backend and frontend.
- **Ticket Detail View:** View ticket information, history, and status update actions.
- **Resolution Note (Stretch Goal):** Add a note when marking a ticket as `Resolved`.

---

## Setup & Running

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Initialize Database
Initialize the PostgreSQL schema and sample tickets:
```bash
cd backend
npm run db:init
```
*(Optional)* If you want to connect to your own PostgreSQL instance, set `DATABASE_URL` in `backend/.env`.

### 3. Start the Project

**Run Backend:**
```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:5000`.

**Run Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:3000`.

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/tickets` | Create a new ticket (defaults to `Open`) |
| `GET` | `/api/tickets` | List tickets with optional `status` & `priority` query params |
| `GET` | `/api/tickets/:id` | Get details for a specific ticket |
| `PATCH` | `/api/tickets/:id/status` | Update ticket status (`Open` ➔ `In Progress` ➔ `Resolved`) |

A ready-to-import Postman collection is included in `postman_collection.json`.

---

## Automated Tests
Run backend validation tests:
```bash
cd backend
npm test
```
All 12 test cases verify endpoints, input validation, and workflow rules.
