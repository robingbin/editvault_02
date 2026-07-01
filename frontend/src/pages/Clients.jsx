import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Phone, Mail, ArrowRight, Users } from 'lucide-react';
import { clients as ALL, videos } from '../mock';

function pendingFor(clientId) {
  return videos.filter((v) => v.client_id === clientId && (v.editor_status !== 'Done' || v.client_status === 'Correction' || v.client_status === 'Rejected')).length;
}

export default function Clients() {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => ALL.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.username.toLowerCase().includes(q.toLowerCase())), [q]);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#e6f7f6] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#2dd4bf]" /> Clients
          </h1>
          <p className="text-sm text-[#7c9394] mt-1">Manage your studio’s clients, their fees, and open work.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[#6b8788] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search clients…"
              className="focus-teal w-64 pl-9 pr-3 py-2 rounded-lg bg-[#0a1112] border border-[#243334] text-sm text-[#e6f7f6] placeholder-[#4b6162] transition-colors"
            />
          </div>
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> New Client
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const pend = pendingFor(c.id);
          return (
            <Link to={`/admin/clients/${c.id}`} key={c.id} className="group block rounded-xl border border-[#152223] bg-[#0a1112] p-5 hover:border-[#1e3a3b] hover:-translate-y-0.5 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0f3a37] to-[#0d2a28] border border-[#1e3a3b] flex items-center justify-center text-[#5eead4] font-semibold">
                    {c.name.slice(0,1)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-[#e6f7f6] truncate">{c.name}</div>
                    <div className="text-[12px] text-[#7c9394] truncate">@{c.username}</div>
                  </div>
                </div>
                {pend > 0 ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-[#5c4711] bg-[#241d0f] text-[#fbbf24]">{pend} pending</span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-[#1e5a3d] bg-[#0e2a1e] text-[#4ade80]">All caught up</span>
                )}
              </div>

              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-[#a8bcbd]"><Phone className="w-3.5 h-3.5 text-[#6b8788]" /> {c.phone}</div>
                <div className="flex items-center gap-2 text-[#a8bcbd] truncate"><Mail className="w-3.5 h-3.5 text-[#6b8788]" /> {c.email}</div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#152223] flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#6b8788]">Monthly Fee</div>
                  <div className="text-[15px] font-semibold text-[#e6f7f6]">₹{c.monthlyFee.toLocaleString()}</div>
                </div>
                <div className="inline-flex items-center gap-1 text-[13px] text-[#5eead4] group-hover:gap-2 transition-all">
                  Open <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-[#6b8788] bg-[#0a1112] border border-[#152223] rounded-xl">No clients match “{q}”.</div>
      )}
    </div>
  );
}
