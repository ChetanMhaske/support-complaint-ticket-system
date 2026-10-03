import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ticketApi } from './services/api';
import TicketList from './components/TicketList';
import CreateTicketModal from './components/CreateTicketModal';
import TicketDetailModal from './components/TicketDetailModal';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Overall metric counts (independent of active table filters)
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Notification toast
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Debounce search input by 300ms to eliminate unnecessary API requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch overall statistics
  const fetchOverallStats = useCallback(async () => {
    try {
      const res = await ticketApi.getTickets({});
      const list = res.data || [];
      setStats({
        total: list.length,
        open: list.filter((t) => t.status === 'Open').length,
        inProgress: list.filter((t) => t.status === 'In Progress').length,
        resolved: list.filter((t) => t.status === 'Resolved').length,
      });
    } catch {
      // Non-blocking for KPI cards
    }
  }, []);

  // Load filtered tickets from backend API
  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ticketApi.getTickets({
        status: statusFilter,
        priority: priorityFilter,
        search: debouncedSearch,
      });
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError(err.message || 'Unable to connect to the backend API.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, debouncedSearch]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    fetchOverallStats();
  }, [fetchOverallStats]);

  // Handle new ticket creation
  const handleCreateTicket = async (formData) => {
    const res = await ticketApi.createTicket(formData);
    showToast(`Ticket #${res.data.id} created successfully with Open status!`, 'success');
    await Promise.all([loadTickets(), fetchOverallStats()]);
  };

  // Handle ticket selection to view details
  const handleSelectTicket = async (ticket) => {
    try {
      // Fetch latest state from backend to guarantee fresh data
      const res = await ticketApi.getTicketById(ticket.id);
      setSelectedTicket(res.data);
      setIsDetailOpen(true);
    } catch {
      setSelectedTicket(ticket);
      setIsDetailOpen(true);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (id, newStatus, note) => {
    const res = await ticketApi.updateTicketStatus(id, newStatus, note);
    showToast(`Ticket #${id} transitioned to ${newStatus}.`, 'success');
    setSelectedTicket(res.data);
    await Promise.all([loadTickets(), fetchOverallStats()]);
  };

  // Clear filters
  const resetFilters = () => {
    setStatusFilter('All');
    setPriorityFilter('All');
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilter !== 'All' || priorityFilter !== 'All' || searchQuery.trim() !== '';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Support / Complaint Ticket System
                </h1>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 ring-1 ring-sky-700/10">
                  Week 2 Assignment
                </span>
              </div>
              <p className="text-xs text-slate-500">
                LEAPLOOMS TECHNOLOGIES LLP • Controlled Status Workflow (Open → In Progress → Resolved)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-sm font-semibold shadow-sm shadow-sky-600/20 transition-all flex items-center gap-2 hover:scale-[1.01]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Raise Ticket</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* Metric Cards - Always display overall system totals */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Tickets</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Logged in system</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">Open Tickets</div>
            <div className="text-2xl font-black text-blue-700 mt-1">{stats.open}</div>
            <div className="text-[11px] text-blue-500 mt-0.5">Awaiting investigation</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">In Progress</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{stats.inProgress}</div>
            <div className="text-[11px] text-amber-600 mt-0.5">Actively being resolved</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Resolved</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{stats.resolved}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Successfully closed</div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets by title, category, or description..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 min-w-[150px]">
                <label className="text-xs font-semibold text-slate-600 shrink-0">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-1.5 min-w-[150px]">
                <label className="text-xs font-semibold text-slate-600 shrink-0">Priority:</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="All">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {/* Reset Button */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Ticket List View */}
        <section>
          <TicketList
            tickets={tickets}
            loading={loading}
            error={error}
            onSelectTicket={handleSelectTicket}
            onRetry={loadTickets}
          />
        </section>
      </main>

      {/* Modals */}
      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreateTicket}
      />

      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-center text-xs text-slate-500">
        <p>
          Support & Complaint Ticket System • Controlled Lifecycle Workflow (Open → In Progress → Resolved)
        </p>
      </footer>
    </div>
  );
}
