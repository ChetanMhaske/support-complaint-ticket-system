import React, { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

export default function TicketDetailModal({ ticket, isOpen, onClose, onStatusUpdate }) {
  const [loading, setLoading] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setResolutionNote('');
    setErrorMessage('');
    setSuccessMessage('');
  }, [ticket?.id]);

  if (!isOpen || !ticket) return null;

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTransition = async (nextStatus) => {
    setErrorMessage('');
    setSuccessMessage('');

    if (nextStatus === 'Resolved' && !resolutionNote.trim()) {
      // Optional stretch note - if empty, we can still proceed or prompt gently
      // Let's pass whatever is typed or null
    }

    try {
      setLoading(true);
      await onStatusUpdate(ticket.id, nextStatus, resolutionNote);
      setSuccessMessage(`Ticket #${ticket.id} successfully updated to '${nextStatus}'.`);
      setResolutionNote('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update ticket status.');
    } finally {
      setLoading(false);
    }
  };

  // Status progression stages
  const stages = [
    { label: 'Open', statusKey: 'Open' },
    { label: 'In Progress', statusKey: 'In Progress' },
    { label: 'Resolved', statusKey: 'Resolved' },
  ];

  const currentStageIndex = stages.findIndex((s) => s.statusKey === ticket.status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white font-mono text-xs font-bold border border-white/10">
                Ticket #{ticket.id}
              </span>
              <span className="text-xs text-slate-300">
                {ticket.category}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight line-clamp-2">
              {ticket.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-white/10 transition-colors shrink-0 ml-4"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
              <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Action Rejected</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
              <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-semibold">Update Succeeded</p>
                <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Workflow Progress Tracker */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Controlled Status Workflow (Open → In Progress → Resolved)
            </h4>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
              {stages.map((stage, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                const isFuture = idx > currentStageIndex;

                let circleClass = 'bg-slate-200 text-slate-500 border-slate-300';
                if (isCurrent) {
                  circleClass = 'bg-sky-600 text-white ring-4 ring-sky-100 border-transparent font-bold';
                } else if (isPassed) {
                  circleClass = 'bg-emerald-600 text-white border-transparent';
                }

                return (
                  <div key={stage.statusKey} className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transition-all ${circleClass}`}>
                      {isPassed ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className={`text-xs mt-1.5 font-medium ${isCurrent ? 'text-sky-700 font-bold' : isPassed ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ticket Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Status</span>
              <StatusBadge status={ticket.status} />
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Priority</span>
              <PriorityBadge priority={ticket.priority} />
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Created Date</span>
              <span className="font-medium text-slate-800">{formatDate(ticket.created_at)}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Last Updated</span>
              <span className="font-medium text-slate-800">{formatDate(ticket.updated_at)}</span>
            </div>
          </div>

          {/* Description Block */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Description
            </h4>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </div>
          </div>

          {/* Resolution Note (if ticket is resolved or being resolved) */}
          {ticket.status === 'Resolved' && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resolution Summary
              </h4>
              <p className="text-sm text-emerald-900 mt-1 whitespace-pre-wrap">
                {ticket.resolution_note || 'Resolved with standard procedure.'}
              </p>
            </div>
          )}

          {/* Status Update Controls */}
          <div className="border-t border-slate-200 pt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
              <span>Status Transition Controls</span>
              <span className="text-[11px] text-slate-400 font-normal">Enforces Business Workflow</span>
            </h4>

            {ticket.status === 'Open' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-200">
                <div className="text-xs text-blue-900">
                  <p className="font-semibold">Next Stage: In Progress</p>
                  <p className="text-blue-700 mt-0.5">Move ticket to In Progress to begin investigation.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTransition('In Progress')}
                  disabled={loading}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    <>
                      <span>Start Progress</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}

            {ticket.status === 'In Progress' && (
              <div className="space-y-3 p-4 bg-amber-50/50 rounded-xl border border-amber-200">
                <div className="text-xs text-amber-900">
                  <p className="font-semibold">Next Stage: Resolved</p>
                  <p className="text-amber-700 mt-0.5">
                    Resolve this ticket once the issue is addressed. You can optionally add a resolution note (Stretch Goal).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Resolution Note (Optional Stretch Goal)
                  </label>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    rows={2}
                    placeholder="e.g. Fixed bug by updating payment webhook validation logic."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleTransition('Resolved')}
                    disabled={loading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      'Resolving...'
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Mark as Resolved</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {ticket.status === 'Resolved' && (
              <div className="p-4 bg-slate-100 rounded-xl text-center border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-800">Workflow Complete</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  This ticket is in the terminal Resolved state and cannot be modified further.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
