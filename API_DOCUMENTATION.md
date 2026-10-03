# Support / Complaint Ticket System - API Documentation

**LEAPLOOMS TECHNOLOGIES LLP — Full Stack Developer Assignment 5**

- **Base URL**: `http://localhost:5000/api`
- **Content-Type**: `application/json`

---

## Controlled Status Workflow

The system enforces a strict one-way business workflow for tickets:

```
[ Open ] ─────────► [ In Progress ] ─────────► [ Resolved ]
```

- When created, every ticket automatically defaults to **`Open`**.
- An `Open` ticket can only transition to **`In Progress`**.
- An `In Progress` ticket can only transition to **`Resolved`**.
- A `Resolved` ticket is terminal and cannot transition further.
- Skipping steps (e.g. `Open` directly to `Resolved`) or moving backwards will be rejected with HTTP **`400 Bad Request`**.

---

## Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service & Database health check |
| `POST` | `/api/tickets` | Create a new ticket (defaults to Open) |
| `GET` | `/api/tickets` | List tickets with optional status & priority filters |
| `GET` | `/api/tickets/:id` | View ticket details by ID |
| `PATCH` | `/api/tickets/:id/status` | Update ticket status along controlled workflow |

---

## Detailed Specifications

### 1. Health Check
- **Method**: `GET`
- **Endpoint**: `/api/health`
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-03T18:50:00.000Z",
  "databaseMode": "pglite",
  "service": "Support / Complaint Ticket System API"
}
```

---

### 2. Create Ticket
- **Method**: `POST`
- **Endpoint**: `/api/tickets`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "title": "Cannot download monthly GST statement",
  "category": "Billing & Payments",
  "description": "Export button returns an empty PDF file on invoice portal.",
  "priority": "High"
}
```
- **Validation Rules**:
  - `title`: String, required, 1-255 characters.
  - `category`: String, required.
  - `description`: String, required.
  - `priority`: Required, must be one of: `Low`, `Medium`, `High`.
  - `status`: Automatically set to `Open` by backend.
- **Success Response `201 Created`**:
```json
{
  "success": true,
  "message": "Ticket created successfully with Open status.",
  "data": {
    "id": 6,
    "title": "Cannot download monthly GST statement",
    "category": "Billing & Payments",
    "description": "Export button returns an empty PDF file on invoice portal.",
    "priority": "High",
    "status": "Open",
    "resolution_note": null,
    "created_at": "2026-10-03T18:50:00.000Z",
    "updated_at": "2026-10-03T18:50:00.000Z"
  }
}
```
- **Error Response `400 Bad Request`**:
```json
{
  "success": false,
  "message": "Title is required. Priority must be one of: Low, Medium, High."
}
```

---

### 3. List and Filter Tickets
- **Method**: `GET`
- **Endpoint**: `/api/tickets`
- **Query Parameters**:
  - `status` *(optional)*: `Open`, `In Progress`, `Resolved`, or `All`
  - `priority` *(optional)*: `Low`, `Medium`, `High`, or `All`
  - `search` *(optional)*: Text query to search in title, category, or description
- **Examples**:
  - `GET /api/tickets`
  - `GET /api/tickets?status=Open`
  - `GET /api/tickets?priority=High`
  - `GET /api/tickets?status=In%20Progress&priority=High`
- **Success Response `200 OK`**:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 6,
      "title": "Cannot download monthly GST statement",
      "category": "Billing & Payments",
      "description": "Export button returns an empty PDF file on invoice portal.",
      "priority": "High",
      "status": "Open",
      "resolution_note": null,
      "created_at": "2026-10-03T18:50:00.000Z",
      "updated_at": "2026-10-03T18:50:00.000Z"
    }
  ]
}
```

---

### 4. View Ticket Details
- **Method**: `GET`
- **Endpoint**: `/api/tickets/:id`
- **Success Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Unable to process invoice payment for March",
    "category": "Billing & Payments",
    "description": "Payment gateway throws error 502 Bad Gateway whenever credit card details are submitted during checkout.",
    "priority": "High",
    "status": "Open",
    "resolution_note": null,
    "created_at": "2026-09-30T18:49:00.000Z",
    "updated_at": "2026-09-30T18:49:00.000Z",
    "allowedNextStatuses": [
      "In Progress"
    ]
  }
}
```
- **Error Response `404 Not Found`**:
```json
{
  "success": false,
  "message": "Ticket with ID #999 was not found."
}
```

---

### 5. Update Ticket Status (Controlled Transition)
- **Method**: `PATCH`
- **Endpoint**: `/api/tickets/:id/status`
- **Headers**: `Content-Type: application/json`

#### Example A: Move from Open to In Progress
```json
{
  "status": "In Progress"
}
```

#### Example B: Move from In Progress to Resolved (With Stretch Goal Resolution Note)
```json
{
  "status": "Resolved",
  "resolution_note": "Re-configured checkout payment gateway timeout and successfully ran test card transaction."
}
```

- **Success Response `200 OK`**:
```json
{
  "success": true,
  "message": "Ticket #1 status successfully transitioned to 'In Progress'.",
  "data": {
    "id": 1,
    "title": "Unable to process invoice payment for March",
    "category": "Billing & Payments",
    "description": "Payment gateway throws error 502 Bad Gateway...",
    "priority": "High",
    "status": "In Progress",
    "resolution_note": null,
    "created_at": "2026-09-30T18:49:00.000Z",
    "updated_at": "2026-10-03T18:52:00.000Z",
    "allowedNextStatuses": [
      "Resolved"
    ]
  }
}
```

- **Controlled Transition Error Response `400 Bad Request`**:
```json
{
  "success": false,
  "message": "Invalid status transition: Open -> Resolved. Cannot transition directly from Open to Resolved. A ticket must first transition to In Progress.",
  "currentStatus": "Open",
  "attemptedStatus": "Resolved",
  "allowedTransitions": ["In Progress"]
}
```
