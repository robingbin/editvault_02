import React, { useMemo, useState } from 'react';
import { Play, CheckCircle2, XCircle, MessageSquare, Lock, ClipboardCheck, Download, Wallet, ReceiptText, Video, CalendarClock, ExternalLink, Eye, Sparkles } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import MonthYearFilter from '../components/MonthYearFilter';
import CorrectionNotesDialog from '../components/CorrectionNotesDialog';
import { useAuth } from '../context/AuthContext';
import { getClientById, getVideosByClient, getExpensesByClient, getBillsByClient, MONTH_LABEL, persist, settings } from '../mock';
import { absoluteUrl, downloadUrl } from '../lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';

export default function ClientHome() {
  const { profile } = useAuth();
  const client = getClientById(profile?.client_id);
  const [tab, setTab] = useState('review');
  const [filter, setFilter] = useState({ month: 6, year: 2026 });
  const [tick, setTick] = useState(0);
  const refresh = () => { persist(); setTick((n) => n + 1); };

  const inMonth = React.useCallback((y, m) => filter.month === 0 ? y === filter.year : y === filter.year && m === filter.month, [filter]);

  const items = useMemo(() => client ? getVideosByClient(client.id).filter((v) => inMonth(v.year, v.month)) : [], [client, filter, tick, inMonth]);
  const approved = useMemo(() => items.filter((v) => ['Approved', 'Posted'].includes(v.client_status)), [items]);
  const review = useMemo(() => items.filter((v) => (
    // Waiting for the client's first review
    (['Sent To Client', 'Done'].includes(v.editor_status) && !['Approved', 'Posted'].includes(v.client_status))
    // OR editor has re-sent after correction – client needs to approve the fix
    || v.editor_status === 'Corrections Updated'
  )), [items]);
  const expenses = useMemo(() => client ? getExpensesByClient(client.id).filter((e) => inMonth(e.year, e.month)) : [], [client, filter, tick, inMonth]);
  const bills = useMemo(() => client ? getBillsByClient(client.id).filter((b) => inMonth(b.year, b.month)) : [], [client, filter, tick, inMonth]);

  const totals = expenses.reduce((a, e) => { a.total += Number(e.amount || 0); if (e.status === 'Paid') a.paid += Number(e.amount || 0); else a.due += Number(e.amount || 0); return a; }, { total: 0, paid: 0, due: 0 });

  const setStatus = (v, s) => {
    v.client_status = s;
    // When client approves a "Corrections Updated" video, close the loop – editor status becomes Done.
    if (s === 'Approved' && v.editor_status === 'Corrections Updated') v.editor_status = 'Done';
    refresh();
    toast.success(`${s} – thanks!`);
  };

  if (!client) return <div className="p-8 text-[#7c9394]">No client mapped to this account.</div>;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="rounded-xl border border-[#152223] bg-[#0a1112] p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {client.logo_url ? (
              <img src={client.logo_url} alt={client.name} className="w-14 h-14 rounded-xl object-contain bg-[#070d0e] border border-[#243334] p-1" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0f3a37] to-[#0d2a28] border border-[#1e3a3b] flex items-center justify-center text-xl text-[#5eead4] font-semibold">
                {client.name.slice(0,1)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#e6f7f6]">Welcome, {client.name}</h1>
              <p className="text-sm text-[#7c9394] mt-1">Review your videos, mark posted dates and track payments.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Total Billed"  value={`₹${totals.total.toLocaleString()}`} />
            <MiniStat label="Paid"          value={`₹${totals.paid.toLocaleString()}`} tone="green" />
            <MiniStat label="Outstanding"   value={`₹${totals.due.toLocaleString()}`} tone="amber" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="inline-flex bg-[#0a1112] border border-[#243334] rounded-lg p-1 overflow-x-auto">
          {[
            { key: 'review',   label: 'For Review',  icon: Video },
            { key: 'approved', label: 'Approved',    icon: CheckCircle2 },
            { key: 'expenses', label: 'Expenses',    icon: Wallet },
            { key: 'invoices', label: 'Invoices',    icon: ReceiptText },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                tab === t.key ? 'bg-[#0f2020] text-[#5eead4] border border-[#1e3a3b]' : 'text-[#a8bcbd] hover:text-[#e6f7f6]'
              }`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
        <MonthYearFilter month={filter.month} year={filter.year} onChange={setFilter} />
      </div>

      {tab === 'review' && <ReviewGrid items={review} onStatus={setStatus} refresh={refresh} />}
      {tab === 'approved' && <ApprovedTable items={approved} refresh={refresh} isAdmin={false} />}
      {tab === 'expenses' && <ExpensesTable expenses={expenses} totals={totals} />}
      {tab === 'invoices' && <InvoicesTable bills={bills} />}
    </div>
  );
}

function MiniStat({ label, value, tone = 'default' }) {
  const color = tone === 'green' ? 'text-[#4ade80]' : tone === 'amber' ? 'text-[#fbbf24]' : 'text-[#e6f7f6]';
  return (
    <div className="px-4 py-2 rounded-lg bg-[#0f1819] border border-[#243334] min-w-[110px]">
      <div className="text-[10px] uppercase text-[#6b8788] tracking-wider">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function ReviewGrid({ items, onStatus, refresh }) {
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const [note, setNote] = useState('');
  const [notesFor, setNotesFor] = useState(null); // video whose thread we're viewing

  const submit = () => {
    if (!target) return;
    if (!note.trim()) { toast.error('Please describe what needs to change'); return; }
    const list = target.corrections || (target.corrections = []);
    list.push({
      id: `cn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      from: 'client',
      note: note.trim(),
    });
    target.client_status = 'Correction';
    // Reset editor state so admin sees a new correction to work on
    target.editor_status = 'Sent To Client';
    refresh && refresh();
    setCorrectionOpen(false); setNote(''); setTarget(null);
    toast.success('Correction request sent');
  };

  if (items.length === 0) return <div className="text-center py-16 text-[#6b8788] bg-[#0a1112] border border-[#152223] rounded-xl">Nothing pending your review right now.</div>;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((v) => {
          const isImage = v.file_url && /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(v.file_name || '');
          const isVideo = v.file_url && /\.(mp4|webm|mov|m4v|ogg)$/i.test(v.file_name || '');
          const isCorrectionUpdate = v.editor_status === 'Corrections Updated';
          const hasNotes = (v.corrections || []).length > 0;
          const displayStatus = isCorrectionUpdate ? 'Correction Approval' : (v.client_status || 'Pending Review');
          return (
          <div key={v.id} className={`rounded-xl border overflow-hidden ${isCorrectionUpdate ? 'border-[#2f3670] bg-[#0d1024]' : 'border-[#152223] bg-[#0a1112]'}`}>
            <div className="relative aspect-video bg-[#050b0c] flex items-center justify-center border-b border-[#152223] overflow-hidden">
              {isVideo ? (
                <video controls preload="metadata" className="w-full h-full object-contain bg-black" src={absoluteUrl(v.file_url)} />
              ) : isImage ? (
                <img src={absoluteUrl(v.file_url)} alt={v.name} className="w-full h-full object-contain" />
              ) : v.file_url ? (
                <a href={absoluteUrl(v.file_url)} target="_blank" rel="noreferrer" className="relative w-14 h-14 rounded-full bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 fill-current" />
                </a>
              ) : (
                <div className="text-[#4b6162] text-xs">No preview file uploaded</div>
              )}
              <div className="absolute top-3 left-3 text-[11px] px-2 py-0.5 rounded border border-[#243334] bg-[#0f1819]/70 text-[#a8bcbd] font-mono">{v.version}</div>
              <div className="absolute top-3 right-3"><StatusBadge status={displayStatus} /></div>
              <div className="absolute bottom-3 right-3 text-[11px] px-2 py-0.5 rounded bg-[#0f1819]/80 text-[#a8bcbd] tabular-nums">{v.duration}</div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-[#e6f7f6] truncate">{v.name}</div>
                  <div className="text-xs text-[#6b8788] mt-0.5">{v.category}</div>
                </div>
                {hasNotes && (
                  <button
                    onClick={() => setNotesFor(v)}
                    title="View correction notes"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[#5e3512] bg-[#2a1a0f] text-[#fb923c] text-[11px] hover:bg-[#3a2311]"
                  >
                    <Eye className="w-3.5 h-3.5" /> Notes ({v.corrections.length})
                  </button>
                )}
              </div>
              {isCorrectionUpdate && (
                <div className="mt-3 rounded-lg border border-[#2f3670] bg-[#12122a] px-3 py-2 text-[12px] text-[#a8a5ff] flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Editor has updated this video based on your correction. Please review the new version and approve, or request more changes.</span>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => onStatus(v, 'Approved')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#1e5a3d] bg-[#0e2a1e] text-[#4ade80] text-xs font-medium hover:bg-[#123b2b]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {isCorrectionUpdate ? 'Approve Correction' : 'Approve'}
                </button>
                <button
                  onClick={() => { setTarget(v); setCorrectionOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#5e3512] bg-[#2a1a0f] text-[#fb923c] text-xs font-medium hover:bg-[#3a2311]"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> {isCorrectionUpdate ? 'Request more changes' : 'Correction'}
                </button>
                {!isCorrectionUpdate && (
                  <button onClick={() => onStatus(v, 'Rejected')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#5b1e1e] bg-[#2a1414] text-[#f87171] text-xs font-medium hover:bg-[#3a1a1a]">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>

      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6]">
          <DialogHeader>
            <DialogTitle>Request Correction</DialogTitle>
            <DialogDescription className="text-[#7c9394]">What needs to change in {target?.name}?</DialogDescription>
          </DialogHeader>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Describe your changes…" className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm text-[#e6f7f6] placeholder-[#4b6162]" />
          <DialogFooter>
            <button onClick={() => setCorrectionOpen(false)} className="px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-sm text-[#a8bcbd] hover:bg-[#152223]">Cancel</button>
            <button onClick={submit} className="px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">Submit</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CorrectionNotesDialog
        open={!!notesFor}
        onOpenChange={(o) => !o && setNotesFor(null)}
        video={notesFor || {}}
        as="client"
        canAdd={false}
      />
    </>
  );
}

export function ApprovedTable({ items, refresh, isAdmin }) {
  const [editId, setEditId] = useState(null);
  const [val, setVal] = useState('');

  const save = (v) => {
    v.posted_date = val || null;
    if (v.posted_date) { v.client_status = 'Posted'; v.client_locked = true; }
    setEditId(null); setVal(''); refresh();
    toast.success('Posted date saved');
  };

  return (
    <div className="bg-[#0a1112] border border-[#152223] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#152223] flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
        <h3 className="text-base font-semibold text-[#e6f7f6]">Approved Videos</h3>
        <span className="ml-auto text-xs text-[#6b8788]">{items.length} items</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0d1516] text-[11px] uppercase tracking-wider text-[#6b8788]">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Duration</th>
              <th className="text-left px-4 py-3 font-medium">Last Version</th>
              <th className="text-right px-4 py-3 font-medium">Payment</th>
              <th className="text-left px-4 py-3 font-medium">Posted Date</th>
              {isAdmin && <th className="text-left px-4 py-3 font-medium">Status</th>}
              <th className="text-right px-4 py-3 font-medium">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#152223]">
            {items.length === 0 ? (
              <tr><td colSpan={isAdmin ? 8 : 7} className="px-4 py-10 text-center text-[#6b8788]">No approved items yet.</td></tr>
            ) : items.map((v) => {
              const isLocked = !!v.posted_date;
              const canEdit = isAdmin || !isLocked;
              return (
                <tr key={v.id} className="ev-row">
                  <td className="px-4 py-3 text-[#e6f7f6]">{v.name}</td>
                  <td className="px-4 py-3 text-[#a8bcbd]">{v.category}</td>
                  <td className="px-4 py-3 text-[#a8bcbd] tabular-nums">{v.duration}</td>
                  <td className="px-4 py-3"><span className="text-[11px] px-1.5 py-0.5 rounded border border-[#243334] bg-[#0f1819] text-[#a8bcbd] font-mono">{v.version}</span></td>
                  <td className="px-4 py-3 text-right text-[#e6f7f6] tabular-nums">₹{Number(v.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {editId === v.id ? (
                      <div className="flex items-center gap-1.5">
                        <input type="date" value={val} onChange={(e) => setVal(e.target.value)} className="focus-teal bg-[#070d0e] border border-[#243334] text-xs rounded px-2 py-1" />
                        <button onClick={() => save(v)} className="p-1 rounded text-[#4ade80] hover:bg-[#0e2a1e]"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setEditId(null); setVal(''); }} className="p-1 rounded text-[#f87171] hover:bg-[#2a1414]"><XCircle className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : v.posted_date ? (
                      <div className="inline-flex items-center gap-1.5 text-[#a8bcbd]">
                        <CalendarClock className="w-3.5 h-3.5 text-[#5eead4]" /> {v.posted_date}
                        {canEdit && <button onClick={() => { setEditId(v.id); setVal(v.posted_date || ''); }} className="text-[11px] text-[#5eead4] hover:underline ml-2">Edit</button>}
                        {!isAdmin && isLocked && <Lock className="w-3 h-3 text-[#5eead4] ml-1" />}
                      </div>
                    ) : (
                      canEdit ? (
                        <button onClick={() => { setEditId(v.id); setVal(''); }} className="text-[#5eead4] hover:underline text-xs">Add posted date</button>
                      ) : <span className="text-[#6b8788] text-xs">—</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <StatusBadge status={v.client_status} />
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    {v.file_url ? (
                      <a
                        href={downloadUrl(v.file_url, v.file_name)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#1e5a3d] bg-[#0e2a1e] text-[#4ade80] text-xs font-medium hover:bg-[#123b2b]"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    ) : (
                      <span className="text-[11px] text-[#6b8788]">no file</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpensesTable({ expenses, totals }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MiniStat label="Total Billed" value={`₹${totals.total.toLocaleString()}`} />
        <MiniStat label="Total Paid"   value={`₹${totals.paid.toLocaleString()}`} tone="green" />
        <MiniStat label="Outstanding"  value={`₹${totals.due.toLocaleString()}`} tone="amber" />
      </div>
      <div className="bg-[#0a1112] border border-[#152223] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#152223] flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#5eead4]" />
          <h3 className="text-base font-semibold text-[#e6f7f6]">Expenses</h3>
          <span className="ml-auto text-[11px] text-[#6b8788]">View-only</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0d1516] text-[11px] uppercase tracking-wider text-[#6b8788]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152223]">
              {expenses.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-[#6b8788]">No expense entries.</td></tr>
              ) : expenses.map((e) => (
                <tr key={e.id} className="ev-row">
                  <td className="px-4 py-3 text-[#a8bcbd] tabular-nums">{e.date}</td>
                  <td className="px-4 py-3 text-[#e6f7f6]">{e.description}</td>
                  <td className="px-4 py-3 text-right text-[#e6f7f6] tabular-nums">₹{Number(e.amount).toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InvoicesTable({ bills }) {
  const navigate = useNavigate();
  return (
    <div className="bg-[#0a1112] border border-[#152223] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#152223] flex items-center gap-2">
        <ReceiptText className="w-4 h-4 text-[#5eead4]" />
        <h3 className="text-base font-semibold text-[#e6f7f6]">Invoices</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0d1516] text-[11px] uppercase tracking-wider text-[#6b8788]">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Invoice #</th>
              <th className="text-left px-4 py-3 font-medium">Period</th>
              <th className="text-left px-4 py-3 font-medium">Generated</th>
              <th className="text-right px-4 py-3 font-medium">Total</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#152223]">
            {bills.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[#6b8788]">No invoices yet.</td></tr>
            ) : bills.map((b) => (
              <tr key={b.id} className="ev-row">
                <td className="px-4 py-3 text-[#e6f7f6] font-mono">{b.invoice_no || b.id}</td>
                <td className="px-4 py-3 text-[#e6f7f6]">{MONTH_LABEL[b.month-1]} {b.year}</td>
                <td className="px-4 py-3 text-[#a8bcbd]">{b.generated_at}</td>
                <td className="px-4 py-3 text-right text-[#e6f7f6] tabular-nums">₹{Number(b.total_amount).toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => navigate(`/invoice/${b.id}`)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-[#243334] bg-[#0f1819] text-[#5eead4] hover:bg-[#152223]">
                    <ExternalLink className="w-3 h-3" /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
