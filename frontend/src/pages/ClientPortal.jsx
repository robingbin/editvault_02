import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Search, ArrowRight, ClipboardList, AlertCircle } from 'lucide-react';
import { clients, videos } from '../lib/store';

function statsForClient(id) {
  const list = videos.filter((v) => v.client_id === id);
  const pending = list.filter((v) => ['Not Started', 'In Progress'].includes(v.editor_status)).length;
  const awaiting = list.filter((v) => v.editor_status === 'Sent To Client' && !['Approved','Correction','Rejected','Posted'].includes(v.client_status)).length;
  const corr = list.filter((v) => v.client_status === 'Correction' || v.client_status === 'Rejected').length;
  return { pending, awaiting, corr, total: list.length };
}

export default function ClientPortal() {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())), [q]);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#e6f7f6] flex items-center gap-2">
            <Monitor className="w-6 h-6 text-[#a8a5ff]" /> Client Portal
          </h1>
          <p className="text-sm text-[#7c9394] mt-1">Preview what each client sees and manage their reviews.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-[#6b8788] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search portals…"
            className="focus-teal w-64 pl-9 pr-3 py-2 rounded-lg bg-[#0a1112] border border-[#243334] text-sm text-[#e6f7f6] placeholder-[#4b6162] transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const s = statsForClient(c.id);
          return (
            <Link to={`/admin/portal/${c.id}`} key={c.id} className="group block rounded-xl border border-[#2b2a55] bg-gradient-to-br from-[#12122a] to-[#0d0d20] p-5 hover:-translate-y-0.5 hover:border-[#3b3a6b] transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#1a1a3f] border border-[#2b2a55] flex items-center justify-center text-[#a8a5ff] font-semibold">
                    {c.name.slice(0,1)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-[#e6f7f6] truncate">{c.name}</div>
                    <div className="text-[12px] text-[#7c7cb0] truncate">@{c.username}</div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 text-[13px] text-[#a8a5ff] group-hover:gap-2 transition-all">
                  Open <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="px-3 py-2 rounded-lg bg-[#0d0d20] border border-[#22224a]">
                  <div className="text-[10px] uppercase text-[#7c7cb0] tracking-wider">Pending</div>
                  <div className="text-base font-semibold text-[#a8a5ff]">{s.pending}</div>
                </div>
                <div className="px-3 py-2 rounded-lg bg-[#0d0d20] border border-[#22224a]">
                  <div className="text-[10px] uppercase text-[#7c7cb0] tracking-wider">Review</div>
                  <div className="text-base font-semibold text-[#fbbf24]">{s.awaiting}</div>
                </div>
                <div className="px-3 py-2 rounded-lg bg-[#0d0d20] border border-[#22224a]">
                  <div className="text-[10px] uppercase text-[#7c7cb0] tracking-wider">Issues</div>
                  <div className="text-base font-semibold text-[#fb923c]">{s.corr}</div>
                </div>
              </div>

              {s.corr > 0 && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[#fb923c]">
                  <AlertCircle className="w-3.5 h-3.5" /> Needs attention
                </div>
              )}
            </Link>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-[#6b8788] bg-[#0a1112] border border-[#152223] rounded-xl">
          <ClipboardList className="w-6 h-6 mx-auto mb-2 opacity-60" />
          No portals match “{q}”.
        </div>
      )}
    </div>
  );
}
