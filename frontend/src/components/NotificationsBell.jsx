import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { activityLog } from '../lib/store';

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const unread = 3;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-md text-[#a8bcbd] hover:text-[#e6f7f6] hover:bg-[#101a1b] transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#2dd4bf] text-[10px] font-bold text-[#062626] flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 z-40 bg-[#0f1819] border border-[#243334] rounded-xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#243334] flex items-center justify-between">
              <div className="text-sm font-semibold text-[#e6f7f6]">Notifications</div>
              <span className="text-[11px] text-[#6b8788]">{activityLog.length} recent</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {activityLog.map((a) => (
                <div key={a.id} className="px-4 py-3 border-b border-[#152223] last:border-b-0 hover:bg-[#101a1b]">
                  <div className="text-[13px] text-[#e6f7f6]">
                    <span className="text-[#5eead4]">{a.actor}</span> {a.action} <span className="text-[#a8bcbd]">“{a.target}”</span>
                  </div>
                  <div className="text-[11px] text-[#6b8788] mt-0.5">{a.client} · {new Date(a.at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
