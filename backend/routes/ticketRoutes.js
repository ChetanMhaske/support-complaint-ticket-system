const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// POST /api/tickets - Create ticket (defaults to Open)
router.post('/', ticketController.createTicket);

// GET /api/tickets - List/filter tickets (?status=...&priority=...)
router.get('/', ticketController.listTickets);

// GET /api/tickets/:id - View ticket details
router.get('/:id', ticketController.getTicketById);

// PATCH /api/tickets/:id/status - Update ticket status (Open -> In Progress -> Resolved)
router.patch('/:id/status', ticketController.updateTicketStatus);

module.exports = router;
