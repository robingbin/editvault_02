import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle2, XCircle, MessageSquare, ShieldCheck, Eye, Sparkles } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import MonthYearFilter from '../components/MonthYearFilter';
import CorrectionNotesDialog from '../components/CorrectionNotesDialog';
import { getClientById, getVideosByClient, persist } from '../mock';
import { absoluteUrl } from '../lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { ApprovedTable } from './ClientHome';

export default function ClientPortalDetail() {
  const { id } = useParams();
  const client = getClientById(id);
  const [filter, setFilter] = useState({ month: 6, year: 2026 });
  const [tick, setTick] = useState(0);
  const refresh = () => { persist(); setTick((n) => n + 1); };

  const inMonth = (y, m) => filter.month === 0 ? y === filter.year : y === filter.year && m === filter.month;

  const items = useMemo(() => id ? getVideosByClient(id).filter((v) => inMonth(v.year, v.month)) : [], [id, filter, tick]);
  const forReview = items.filter((v) => (
    (['Sent To Client', 'Done'].includes(v.editor_status) && !['Approved', 'Posted'].includes(v.client_status))
    || v.editor_status === 'Corrections Updated'
  ));
  const approved = items.filter((v) => ['Approved', 'Posted'].includes(v.client_status));

  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const [note, setNote] = useState('');
  const [notesFor, setNotesFor] = useState(null);

  if (!client) return <div className="p-8 text-center text-[#7c9394]">Client not found. <Link className="text-[#2dd4bf]" to="/admin/portal">Back</Link></div>;

  const setStatus = (v, s) => {
    v.client_status = s;
    if (s === 'Approved' && v.editor_status === 'Corrections Updated') v.editor_status = 'Done';
    refresh();
    toast.success(`Marked ${s}`);
  };

  const submitCorrection = () => {
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
    target.editor_status = 'Sent To Client';
    refresh();
    setCorrectionOpen(false); setNote(''); setTarget(null);
    toast.success('Correction request sent');
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      <Link to="/admin/portal" className="inline-flex items-center gap-2 text-sm text-[#a8bcbd] hover:text-[#e6f7f6]">
        <ArrowLeft className="w-4 h-4" /> Back to Client Portal
      </Link>

      <div className="rounded-xl border border-[#2b2a55] bg-gradient-to-br from-[#12122a] to-[#0d0d20] p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1a1a3f] border border-[#2b2a55] flex items-center justify-center text-[#a8a5ff] text-xl font-semibold">{client.name.slice(0,1)}</div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-[#e6f7f6]">{client.name} · Review</h1>
            <p className="text-sm text-[#7c7cb0]">Approve, request corrections or reject videos submitted for review. You can also edit posted dates on approved items.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#2b2a55] bg-[#0d0d20] text-[#a8a5ff] text-xs">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin Preview
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <MonthYearFilter month={filter.month} year={filter.year} onChange={setFilter} />
      </div>

      <div>
        <h2 className="text-[13px] uppercase tracking-wider text-[#6b8788] mb-3">For Review · {forReview.length}</h2>
        {forReview.length === 0 ? (
          <div className="text-center py-10 text-[#6b8788] bg-[#0a1112] border border-[#152223] rounded-xl">No videos are pending review in this period.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forReview.map((v) => {
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
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold text-[#e6f7f6] truncate">{v.name}</div>
                      <div className="text-xs text-[#6b8788] mt-0.5">{v.category} · ₹{v.amount.toLocaleString()}</div>
                    </div>
                    {hasNotes && (
                      <button onClick={() => setNotesFor(v)} title="View correction notes" className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[#5e3512] bg-[#2a1a0f] text-[#fb923c] text-[11px] hover:bg-[#3a2311]">
                        <Eye className="w-3.5 h-3.5" /> Notes ({v.corrections.length})
                      </button>
                    )}
                  </div>
                  {isCorrectionUpdate && (
                    <div className="rounded-lg border border-[#2f3670] bg-[#12122a] px-3 py-2 text-[12px] text-[#a8a5ff] flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>Editor has updated this video based on the client\u2019s correction. Client should approve or request more changes.</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setStatus(v, 'Approved')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#1e5a3d] bg-[#0e2a1e] text-[#4ade80] text-xs font-medium hover:bg-[#123b2b]"><CheckCircle2 className="w-3.5 h-3.5" /> {isCorrectionUpdate ? 'Approve Correction' : 'Approve'}</button>
                    <button onClick={() => { setTarget(v); setCorrectionOpen(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#5e3512] bg-[#2a1a0f] text-[#fb923c] text-xs font-medium hover:bg-[#3a2311]"><MessageSquare className="w-3.5 h-3.5" /> {isCorrectionUpdate ? 'Request more changes' : 'Correction'}</button>
                    {!isCorrectionUpdate && (
                      <button onClick={() => setStatus(v, 'Rejected')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#5b1e1e] bg-[#2a1414] text-[#f87171] text-xs font-medium hover:bg-[#3a1a1a]"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-[13px] uppercase tracking-wider text-[#6b8788] mb-3">Approved · {approved.length}</h2>
        <ApprovedTable items={approved} refresh={refresh} isAdmin={true} />
      </div>

      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6]">
          <DialogHeader>
            <DialogTitle>Request Correction</DialogTitle>
            <DialogDescription className="text-[#7c9394]">Add a note for {target?.name}.</DialogDescription>
          </DialogHeader>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Describe what needs to change…" className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm text-[#e6f7f6] placeholder-[#4b6162]" />
          <DialogFooter>
            <button onClick={() => setCorrectionOpen(false)} className="px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-sm text-[#a8bcbd] hover:bg-[#152223]">Cancel</button>
            <button onClick={submitCorrection} className="px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">Submit</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CorrectionNotesDialog
        open={!!notesFor}
        onOpenChange={(o) => !o && setNotesFor(null)}
        video={notesFor || {}}
        as="admin"
        canAdd={false}
      />
    </div>
  );
}
