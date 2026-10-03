import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  const normalized = status ? status.toLowerCase() : '';

  let styles = 'bg-slate-100 text-slate-700 ring-slate-600/20';
  let dotColor = 'bg-slate-400';

  if (normalized === 'open') {
    styles = 'bg-blue-50 text-blue-700 ring-blue-700/20';
    dotColor = 'bg-blue-500 animate-pulse';
  } else if (normalized === 'in progress') {
    styles = 'bg-amber-50 text-amber-700 ring-amber-700/20';
    dotColor = 'bg-amber-500';
  } else if (normalized === 'resolved') {
    styles = 'bg-emerald-50 text-emerald-700 ring-emerald-700/20';
    dotColor = 'bg-emerald-500';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${styles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status || 'Unknown'}
    </span>
  );
}
