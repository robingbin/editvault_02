import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ListChecks, Clock3, Users2, IndianRupee, AlertTriangle, X } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { clients, videos as ALL_VIDEOS, bills as ALL_BILLS, MONTH_LABEL, getClientById } from '../mock';

function StatCard({ label, value, icon: Icon, tone = 'teal' }) {
  const tones = {
    teal:   { bg: 'bg-[#0e2020]', ring: 'border-[#1e3a3b]',  iconWrap: 'bg-[#0f2929] text-[#5eead4]' },
    amber:  { bg: 'bg-[#1e1a0d]', ring: 'border-[#493a12]',  iconWrap: 'bg-[#2a2410] text-[#fbbf24]' },
    green:  { bg: 'bg-[#0e1f16]', ring: 'border-[#1e5a3d]',  iconWrap: 'bg-[#0e2a1e] text-[#4ade80]' },
    purple: { bg: 'bg-[#12122a]', ring: 'border-[#2b2a55]',  iconWrap: 'bg-[#1a1a3f] text-[#a8a5ff]' },
    red:    { bg: 'bg-[#1f1010]', ring: 'border-[#5b1e1e]',  iconWrap: 'bg-[#2a1414] text-[#f87171]' },
  }[tone];
  return (
    <div className={`relative rounded-xl border ${tones.ring} ${tones.bg} p-4 overflow-hidden group hover:-translate-y-0.5 transition-transform`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#7c9394]">{label}</div>
          <div className="mt-1.5 text-2xl font-semibold text-[#e6f7f6]">{value}</div>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tones.iconWrap}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
    </div>
  );
}

function VideoTable({ title, subtitle, videos, tone = 'default' }) {
  const titleColor = tone === 'correction' ? 'text-[#fb923c]' : tone === 'rejected' ? 'text-[#f87171]' : 'text-[#e6f7f6]';
  return (
    <div className="bg-[#0a1112] border border-[#152223] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#152223] flex items-start justify-between">
        <div>
          <h3 className={`text-base font-semibold ${titleColor}`}>{title}</h3>
          {subtitle && <p className="text-xs text-[#6b8788] mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-[11px] px-2 py-1 rounded-full bg-[#101a1b] border border-[#243334] text-[#a8bcbd]">{videos.length} videos</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0d1516] text-[11px] uppercase tracking-wider text-[#6b8788]">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Client</th>
              <th className="text-left px-5 py-3 font-medium">Video</th>
              <th className="text-left px-5 py-3 font-medium">Due Date</th>
              <th className="text-left px-5 py-3 font-medium">Editor Status</th>
              <th className="text-left px-5 py-3 font-medium">Client Status</th>
              <th className="text-left px-5 py-3 font-medium">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#152223]">
            {videos.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-[#6b8788] text-sm">Nothing here.</td></tr>
            ) : videos.map((v) => (
              <tr key={v.id} className="ev-row">
                <td className="px-5 py-3 text-[#e6f7f6]">{getClientById(v.client_id)?.name}</td>
                <td className="px-5 py-3 text-[#a8bcbd]">{v.name}</td>
                <td className="px-5 py-3 text-[#7c9394]">{v.due_date}</td>
                <td className="px-5 py-3"><StatusBadge status={v.editor_status} /></td>
                <td className="px-5 py-3"><StatusBadge status={v.client_status} /></td>
                <td className="px-5 py-3 text-[#a8bcbd]">{v.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const now = new Date();
  const year = 2026;
  const month = 6;

  const monthVideos = useMemo(() => ALL_VIDEOS.filter((v) => v.year === year && v.month === month), [year, month]);
  const pending = useMemo(() => monthVideos.filter((v) => ['Not Started', 'In Progress'].includes(v.editor_status)), [monthVideos]);
  const corrections = useMemo(() => monthVideos.filter((v) => v.client_status === 'Correction'), [monthVideos]);
  const rejected = useMemo(() => monthVideos.filter((v) => v.client_status === 'Rejected'), [monthVideos]);
  const monthPayments = useMemo(() => ALL_BILLS.filter((p) => p.year === year && p.month === month), [year, month]);

  const awaiting = monthVideos.filter((v) => v.editor_status === 'Sent To Client' && !['Approved','Correction','Rejected','Posted'].includes(v.client_status)).length;
  const activeClientsCount = clients.filter((c) => c.active).length;
  const billing = monthVideos.filter((v) => v.client_status === 'Approved' && v.client_locked).reduce((a, v) => a + Number(v.amount || 0), 0);
  const pendingPayTotal = monthPayments.filter((p) => p.status === 'Pending').reduce((a, p) => a + Number(p.total_amount || 0), 0);

  const totalBilling = monthPayments.reduce((a, p) => a + Number(p.total_amount || 0), 0);
  const received = monthPayments.filter((p) => p.status === 'Paid').reduce((a, p) => a + Number(p.total_amount || 0), 0);
  const pendingTotal = totalBilling - received;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#e6f7f6]">Dashboard</h1>
          <p className="text-sm text-[#7c9394] mt-1">Overview of your video editing workflow · {MONTH_LABEL[month-1]} {year}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/admin/portal')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2b2a55] bg-[#12122a] text-[#a8a5ff] hover:bg-[#181840] text-sm font-medium transition-colors"
          >
            Client Portal <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/admin/clients')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-[#e6f7f6] hover:bg-[#152223] text-sm font-medium transition-colors"
          >
            View Clients <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Pending Work"       value={pending.length}                                       icon={ListChecks} tone="teal" />
        <StatCard label="Awaiting Client"    value={awaiting}                                             icon={Clock3}     tone="amber" />
        <StatCard label="Active Clients"     value={activeClientsCount}                                   icon={Users2}     tone="purple" />
        <StatCard label="This Month Billing" value={`₹${billing.toLocaleString()}`}                        icon={IndianRupee} tone="green" />
        <StatCard label="Pending Payment"    value={`₹${pendingPayTotal.toLocaleString()}`}                icon={AlertTriangle} tone="red" />
      </div>

      <VideoTable title="Pending Work" subtitle="Videos not yet completed by the editor" videos={pending} />

      {corrections.length > 0 && (
        <VideoTable title="Correction Requested" subtitle="Clients have asked for changes" videos={corrections} tone="correction" />
      )}
      {rejected.length > 0 && (
        <VideoTable title="Rejected Videos" subtitle="Rejected by clients" videos={rejected} tone="rejected" />
      )}

      {/* Payment Summary */}
      <div className="bg-[#0a1112] border border-[#152223] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#152223] flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#e6f7f6]">Monthly Payment Summary — {MONTH_LABEL[month-1]} {year}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0d1516] text-[11px] uppercase tracking-wider text-[#6b8788]">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Client Name</th>
                <th className="text-left px-5 py-3 font-medium">Month</th>
                <th className="text-left px-5 py-3 font-medium">Total Amount</th>
                <th className="text-left px-5 py-3 font-medium">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152223]">
              {monthPayments.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-[#6b8788]">No payments recorded for this month.</td></tr>
              ) : monthPayments.map((p) => (
                <tr key={p.id} className="ev-row">
                  <td className="px-5 py-3 text-[#e6f7f6]">{getClientById(p.client_id)?.name}</td>
                  <td className="px-5 py-3 text-[#a8bcbd]">{MONTH_LABEL[p.month-1]} {p.year}</td>
                  <td className="px-5 py-3 text-[#e6f7f6]">₹{Number(p.total_amount).toLocaleString()}</td>
                  <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[#152223] border-t border-[#152223]">
          <div className="px-5 py-4">
            <div className="text-[11px] uppercase tracking-wider text-[#6b8788]">Total Billing</div>
            <div className="mt-1 text-lg font-semibold text-[#e6f7f6]">₹{totalBilling.toLocaleString()}</div>
          </div>
          <div className="px-5 py-4">
            <div className="text-[11px] uppercase tracking-wider text-[#6b8788]">Received</div>
            <div className="mt-1 text-lg font-semibold text-[#4ade80]">₹{received.toLocaleString()}</div>
          </div>
          <div className="px-5 py-4">
            <div className="text-[11px] uppercase tracking-wider text-[#6b8788]">Pending</div>
            <div className="mt-1 text-lg font-semibold text-[#fbbf24]">₹{pendingTotal.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
