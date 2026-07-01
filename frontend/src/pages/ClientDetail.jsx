import React, { useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, IndianRupee, Plus, Play, Download, Pencil, Trash2, Video, Calendar } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { getClientById, getVideosByClient, MONTH_LABEL } from '../mock';
import { toast } from 'sonner';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = getClientById(id);
  const [monthKey, setMonthKey] = useState('2026-06');

  const monthOptions = useMemo(() => ([
    { key: '2026-04', label: 'Apr 2026' },
    { key: '2026-05', label: 'May 2026' },
    { key: '2026-06', label: 'Jun 2026' },
  ]), []);

  const list = useMemo(() => {
    if (!client) return [];
    const [y, m] = monthKey.split('-').map((n) => Number(n));
    return getVideosByClient(client.id).filter((v) => v.year === y && v.month === m);
  }, [client, monthKey]);

  if (!client) {
    return (
      <div className="p-8 text-center text-[#7c9394]">Client not found. <Link className="text-[#2dd4bf]" to="/admin/clients">Back to clients</Link></div>
    );
  }

  const totals = list.reduce((acc, v) => {
    acc.count += 1;
    acc.amount += Number(v.amount || 0);
    if (v.client_status === 'Approved' && v.client_locked) acc.billing += Number(v.amount || 0);
    return acc;
  }, { count: 0, amount: 0, billing: 0 });

  return (
    <div className="space-y-6 max-w-[1400px]">
      <button onClick={() => navigate('/admin/clients')} className="inline-flex items-center gap-2 text-sm text-[#a8bcbd] hover:text-[#e6f7f6]">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </button>

      {/* Header card */}
      <div className="relative rounded-xl border border-[#152223] bg-[#0a1112] p-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.08),transparent_50%)]" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f3a37] to-[#0d2a28] border border-[#1e3a3b] flex items-center justify-center text-2xl text-[#5eead4] font-semibold">
            {client.name.slice(0,1)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-[#e6f7f6]">{client.name}</h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#a8bcbd]">
              <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#6b8788]" />{client.phone}</span>
              <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#6b8788]" />{client.email}</span>
              <span className="inline-flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5 text-[#6b8788]" />{client.monthlyFee.toLocaleString()} / month</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="px-4 py-2 rounded-lg bg-[#0f1819] border border-[#243334]">
              <div className="text-[10px] uppercase text-[#6b8788] tracking-wider">Videos</div>
              <div className="text-lg font-semibold text-[#e6f7f6]">{totals.count}</div>
            </div>
            <div className="px-4 py-2 rounded-lg bg-[#0f1819] border border-[#243334]">
              <div className="text-[10px] uppercase text-[#6b8788] tracking-wider">Amount</div>
              <div className="text-lg font-semibold text-[#e6f7f6]">₹{totals.amount.toLocaleString()}</div>
            </div>
            <div className="px-4 py-2 rounded-lg bg-[#0f1819] border border-[#243334]">
              <div className="text-[10px] uppercase text-[#6b8788] tracking-wider">Billable</div>
              <div className="text-lg font-semibold text-[#4ade80]">₹{totals.billing.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Month tabs + Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="inline-flex bg-[#0a1112] border border-[#243334] rounded-lg p-1">
          {monthOptions.map((m) => (
            <button
              key={m.key}
              onClick={() => setMonthKey(m.key)}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${
                monthKey === m.key ? 'bg-[#0f2020] text-[#5eead4] border border-[#1e3a3b]' : 'text-[#a8bcbd] hover:text-[#e6f7f6]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => toast('Export coming soon')} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] hover:bg-[#152223] text-sm text-[#a8bcbd]">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => toast.success('New video added (mock)')} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">
            <Plus className="w-4 h-4" /> Add Video
          </button>
        </div>
      </div>

      {/* Videos table */}
      <div className="bg-[#0a1112] border border-[#152223] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#152223] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#e6f7f6] flex items-center gap-2"><Video className="w-4 h-4 text-[#2dd4bf]" /> Videos — {monthOptions.find((o) => o.key === monthKey)?.label}</h3>
            <p className="text-xs text-[#6b8788] mt-0.5">All videos worked on during this month</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0d1516] text-[11px] uppercase tracking-wider text-[#6b8788]">
              <tr>
                <th className="text-left px-4 py-3 font-medium w-10">#</th>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Duration</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Ver</th>
                <th className="text-left px-4 py-3 font-medium">Editor Status</th>
                <th className="text-left px-4 py-3 font-medium">Client Status</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152223]">
              {list.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-[#6b8788]">No videos this month.</td></tr>
              ) : list.map((v, idx) => (
                <tr key={v.id} className="ev-row">
                  <td className="px-4 py-3 text-[#6b8788]">{idx + 1}</td>
                  <td className="px-4 py-3 text-[#e6f7f6]">{v.name}</td>
                  <td className="px-4 py-3 text-[#a8bcbd] tabular-nums">{v.duration}</td>
                  <td className="px-4 py-3 text-[#a8bcbd]">{v.type}</td>
                  <td className="px-4 py-3"><span className="text-[11px] px-1.5 py-0.5 rounded border border-[#243334] bg-[#0f1819] text-[#a8bcbd] font-mono">{v.version}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={v.editor_status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={v.client_status} /></td>
                  <td className="px-4 py-3 text-[#7c9394]">{v.date || '—'}</td>
                  <td className="px-4 py-3 text-right text-[#e6f7f6] tabular-nums">₹{v.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toast('Preview (mock)')} className="p-1.5 rounded-md text-[#5eead4] hover:bg-[#0f2020]"><Play className="w-4 h-4" /></button>
                      <button onClick={() => toast('Edit (mock)')} className="p-1.5 rounded-md text-[#a8bcbd] hover:bg-[#101a1b]"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => toast('Delete (mock)')} className="p-1.5 rounded-md text-[#f87171] hover:bg-[#2a1414]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {list.length > 0 && (
              <tfoot>
                <tr className="bg-[#0d1516] border-t border-[#152223]">
                  <td colSpan={8} className="px-4 py-3 text-right text-[#7c9394] uppercase tracking-wider text-[11px]">Total</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#e6f7f6] tabular-nums">₹{totals.amount.toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
