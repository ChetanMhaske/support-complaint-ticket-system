import React from 'react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

export default function TicketList({
  tickets,
  loading,
  error,
  onSelectTicket,
  onRetry,
}) {
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sky-50 text-sky-600 animate-spin">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Loading Support Tickets...</p>
          <p className="text-xs text-slate-500 mt-1">Retrieving ticket records from PostgreSQL database</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-8 text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-800">Error Loading Tickets</h3>
        <p className="text-xs text-rose-600 max-w-md mx-auto">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-slate-800">No Tickets Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No support tickets match the selected status or priority filters. Try clearing your filters or create a new ticket.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4 w-20">ID</th>
              <th className="py-3.5 px-4">Title & Category</th>
              <th className="py-3.5 px-4 w-32">Priority</th>
              <th className="py-3.5 px-4 w-36">Status</th>
              <th className="py-3.5 px-4 w-32">Created Date</th>
              <th className="py-3.5 px-4 w-28 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
              >
                <td className="py-4 px-4 font-mono font-bold text-xs text-slate-500">
                  #{ticket.id}
                </td>
                <td className="py-4 px-4">
                  <div className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                    {ticket.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {ticket.category}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="py-4 px-4">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                  {formatDate(ticket.created_at)}
                </td>
                <td className="py-4 px-4 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTicket(ticket);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-sm"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => onSelectTicket(ticket)}
            className="p-4 hover:bg-slate-50 cursor-pointer transition-colors space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-500">
                #{ticket.id}
              </span>
              <div className="flex items-center gap-1.5">
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">
                {ticket.title}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{ticket.category}</p>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs text-slate-400 border-t border-slate-50">
              <span>{formatDate(ticket.created_at)}</span>
              <span className="font-medium text-sky-600 flex items-center gap-1">
                View Details
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
