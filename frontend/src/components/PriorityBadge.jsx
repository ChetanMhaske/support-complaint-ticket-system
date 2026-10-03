import React from 'react';

export default function PriorityBadge({ priority, className = '' }) {
  const normalized = priority ? priority.toLowerCase() : '';

  let styles = 'bg-slate-100 text-slate-700 ring-slate-600/20';

  if (normalized === 'high') {
    styles = 'bg-rose-50 text-rose-700 ring-rose-700/20';
  } else if (normalized === 'medium') {
    styles = 'bg-orange-50 text-orange-700 ring-orange-700/20';
  } else if (normalized === 'low') {
    styles = 'bg-slate-100 text-slate-700 ring-slate-600/20';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${styles} ${className}`}
    >
      {normalized === 'high' && (
        <svg className="w-3 h-3 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      )}
      {normalized === 'medium' && (
        <svg className="w-3 h-3 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 12H5" />
        </svg>
      )}
      {normalized === 'low' && (
        <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      )}
      {priority || 'Unknown'}
    </span>
  );
}
