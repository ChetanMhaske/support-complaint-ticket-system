const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Handle API responses with robust error message parsing
 */
async function handleResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMsg = data?.message || `HTTP Error ${response.status}: ${response.statusText}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const ticketApi = {
  /**
   * Fetch tickets with optional status, priority, and search filters
   */
  async getTickets(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'All') {
      params.append('status', filters.status);
    }
    if (filters.priority && filters.priority !== 'All') {
      params.append('priority', filters.priority);
    }
    if (filters.search && filters.search.trim()) {
      params.append('search', filters.search.trim());
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE}/tickets${query}`);
    return handleResponse(response);
  },

  /**
   * Fetch single ticket details by ID
   */
  async getTicketById(id) {
    const response = await fetch(`${API_BASE}/tickets/${id}`);
    return handleResponse(response);
  },

  /**
   * Create a new ticket (status defaults to Open on backend)
   */
  async createTicket(ticketData) {
    const response = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData),
    });
    return handleResponse(response);
  },

  /**
   * Update status with controlled transition: Open -> In Progress -> Resolved
   */
  async updateTicketStatus(id, status, resolutionNote = null) {
    const body = { status };
    if (resolutionNote !== null && resolutionNote !== undefined) {
      body.resolution_note = resolutionNote;
    }

    const response = await fetch(`${API_BASE}/tickets/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },
};
