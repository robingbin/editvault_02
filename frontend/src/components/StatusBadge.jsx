import React from 'react';
import clsx from 'clsx';

// Style map for editor / client statuses
const STYLES = {
  // Editor statuses
  'Not Started':        'bg-[#141b1c] text-[#8ea1a2] border-[#243334]',
  'In Progress':        'bg-[#1a2033] text-[#93a5ff] border-[#2f3670]',
  'Sent To Client':     'bg-[#0f2429] text-[#5eead4] border-[#1d5b62]',
  'Corrections Updated':'bg-[#2a1a0f] text-[#fbbf24] border-[#5e3512]',
  'Done':               'bg-[#0e2a1e] text-[#4ade80] border-[#1e5a3d]',

  // Client statuses
  'Pending Review':     'bg-[#241d0f] text-[#fbbf24] border-[#5c4711]',
  'Approved':           'bg-[#0e2a1e] text-[#4ade80] border-[#1e5a3d]',
  'Correction':         'bg-[#2a1a0f] text-[#fb923c] border-[#5e3512]',
  'Correction Approval':'bg-[#1a2033] text-[#93a5ff] border-[#2f3670]',
  'Rejected':           'bg-[#2a1414] text-[#f87171] border-[#5b1e1e]',
  'Posted':             'bg-[#0f2429] text-[#5eead4] border-[#1d5b62]',

  // Payment
  'Paid':               'bg-[#0e2a1e] text-[#4ade80] border-[#1e5a3d]',
  'Pending':            'bg-[#241d0f] text-[#fbbf24] border-[#5c4711]',
};

export default function StatusBadge({ status, className }) {
  if (!status) return <span className="text-[#4b6162] text-xs">—</span>;
  const style = STYLES[status] || 'bg-[#141b1c] text-[#8ea1a2] border-[#243334]';
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium whitespace-nowrap', style, className)}>
      {status}
    </span>
  );
}
