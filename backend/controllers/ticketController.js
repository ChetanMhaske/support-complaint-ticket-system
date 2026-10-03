const { query } = require('../config/db');

// Allowed enum values
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];
const VALID_STATUSES = ['Open', 'In Progress', 'Resolved'];

// Allowed status transitions: current -> next
const ALLOWED_TRANSITIONS = {
  'Open': ['In Progress'],
  'In Progress': ['Resolved'],
  'Resolved': [] // Terminal state
};

/**
 * Normalizes case for priority ('low' -> 'Low')
 */
function normalizePriority(val) {
  if (!val || typeof val !== 'string') return null;
  const match = VALID_PRIORITIES.find(p => p.toLowerCase() === val.trim().toLowerCase());
  return match || null;
}

/**
 * Normalizes case for status ('in progress' -> 'In Progress')
 */
function normalizeStatus(val) {
  if (!val || typeof val !== 'string') return null;
  const match = VALID_STATUSES.find(s => s.toLowerCase() === val.trim().toLowerCase());
  return match || null;
}

/**
 * POST /api/tickets
 * Create a new ticket (defaults to 'Open' status)
 */
async function createTicket(req, res) {
  try {
    const { title, category, description, priority } = req.body || {};

    // Field validation
    const errors = [];
    if (!title || typeof title !== 'string' || !title.trim()) {
      errors.push('Title is required and must not be empty.');
    } else if (title.trim().length > 255) {
      errors.push('Title must be at most 255 characters.');
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      errors.push('Category is required.');
    } else if (category.trim().length > 100) {
      errors.push('Category must be at most 100 characters.');
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      errors.push('Description is required.');
    } else if (description.trim().length > 5000) {
      errors.push('Description must be at most 5000 characters.');
    }

    const normalizedPriority = normalizePriority(priority);
    if (!normalizedPriority) {
      errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
        errors
      });
    }

    // Default status strictly to 'Open'
    const status = 'Open';

    const insertSql = `
      INSERT INTO tickets (title, category, description, priority, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const result = await query(insertSql, [
      title.trim(),
      category.trim(),
      description.trim(),
      normalizedPriority,
      status
    ]);

    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully with Open status.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error in createTicket:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating ticket.',
      error: err.message
    });
  }
}

/**
 * GET /api/tickets
 * List tickets with optional status, priority, and text search filters
 */
async function listTickets(req, res) {
  try {
    const { status, priority, search } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Filter by status if provided and not 'all'
    if (status && status.trim() && status.toLowerCase() !== 'all') {
      const normStatus = normalizeStatus(status);
      if (!normStatus) {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter. Allowed values: All, ${VALID_STATUSES.join(', ')}.`
        });
      }
      conditions.push(`status = $${paramIndex++}`);
      params.push(normStatus);
    }

    // Filter by priority if provided and not 'all'
    if (priority && priority.trim() && priority.toLowerCase() !== 'all') {
      const normPriority = normalizePriority(priority);
      if (!normPriority) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority filter. Allowed values: All, ${VALID_PRIORITIES.join(', ')}.`
        });
      }
      conditions.push(`priority = $${paramIndex++}`);
      params.push(normPriority);
    }

    // Text search filter with wildcard sanitization
    if (search && search.trim()) {
      // Escape SQL ILIKE wildcards %, _, and \ so literal searches work accurately
      const sanitized = search.trim().replace(/([%_\\])/g, '\\$1');
      conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`);
      params.push(`%${sanitized}%`);
      paramIndex++;
    }

    let sql = 'SELECT * FROM tickets';
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY id DESC;';

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in listTickets:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving tickets.',
      error: err.message
    });
  }
}

/**
 * GET /api/tickets/:id
 * Retrieve single ticket details by ID
 */
async function getTicketById(req, res) {
  try {
    const { id } = req.params;
    const ticketId = parseInt(id, 10);

    if (isNaN(ticketId) || ticketId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket ID. Must be a positive integer.'
      });
    }

    const result = await query('SELECT * FROM tickets WHERE id = $1', [ticketId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Ticket with ID #${ticketId} was not found.`
      });
    }

    const ticket = result.rows[0];
    const allowedNextStatuses = ALLOWED_TRANSITIONS[ticket.status] || [];

    return res.status(200).json({
      success: true,
      data: {
        ...ticket,
        allowedNextStatuses
      }
    });
  } catch (err) {
    console.error('Error in getTicketById:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching ticket.',
      error: err.message
    });
  }
}

/**
 * PATCH /api/tickets/:id/status
 * Update ticket status following controlled transition rules:
 * Open -> In Progress -> Resolved
 */
async function updateTicketStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, resolution_note } = req.body || {};
    const ticketId = parseInt(id, 10);

    if (isNaN(ticketId) || ticketId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket ID. Must be a positive integer.'
      });
    }

    // Validate requested status
    const targetStatus = normalizeStatus(status);
    if (!targetStatus) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}.`
      });
    }

    // Fetch current ticket
    const checkRes = await query('SELECT * FROM tickets WHERE id = $1', [ticketId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Ticket with ID #${ticketId} was not found.`
      });
    }

    const currentTicket = checkRes.rows[0];
    const currentStatus = currentTicket.status;

    // Check if status is already the requested status
    if (currentStatus === targetStatus) {
      return res.status(400).json({
        success: false,
        message: `Ticket #${ticketId} is already in '${currentStatus}' status.`
      });
    }

    // Controlled transition check: Open -> In Progress -> Resolved
    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(targetStatus)) {
      let explanation = '';
      if (currentStatus === 'Resolved') {
        explanation = 'Ticket is already Resolved and cannot be reopened or transitioned.';
      } else if (currentStatus === 'Open' && targetStatus === 'Resolved') {
        explanation = 'Cannot transition directly from Open to Resolved. A ticket must first transition to In Progress.';
      } else {
        explanation = `Cannot transition from '${currentStatus}' to '${targetStatus}'. Allowed next status: ${allowedNext.length > 0 ? allowedNext.join(', ') : 'none'}.`;
      }

      return res.status(400).json({
        success: false,
        message: `Invalid status transition: ${currentStatus} -> ${targetStatus}. ${explanation}`,
        currentStatus,
        attemptedStatus: targetStatus,
        allowedTransitions: allowedNext
      });
    }

    // Prepare update parameters
    let noteToStore = currentTicket.resolution_note;
    if (targetStatus === 'Resolved') {
      if (resolution_note !== undefined && resolution_note !== null) {
        if (typeof resolution_note === 'string') {
          if (resolution_note.trim().length > 2000) {
            return res.status(400).json({
              success: false,
              message: 'Resolution note must be at most 2000 characters.'
            });
          }
          noteToStore = resolution_note.trim();
        }
      }
    }

    const updateSql = `
      UPDATE tickets
      SET status = $1,
          resolution_note = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `;

    const updateRes = await query(updateSql, [targetStatus, noteToStore, ticketId]);
    const updatedTicket = updateRes.rows[0];
    const nextAllowed = ALLOWED_TRANSITIONS[updatedTicket.status] || [];

    return res.status(200).json({
      success: true,
      message: `Ticket #${ticketId} status successfully transitioned to '${targetStatus}'.`,
      data: {
        ...updatedTicket,
        allowedNextStatuses: nextAllowed
      }
    });
  } catch (err) {
    console.error('Error in updateTicketStatus:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating ticket status.',
      error: err.message
    });
  }
}

module.exports = {
  createTicket,
  listTickets,
  getTicketById,
  updateTicketStatus,
  VALID_PRIORITIES,
  VALID_STATUSES,
  ALLOWED_TRANSITIONS
};
