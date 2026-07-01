import React, { useMemo, useState } from 'react';
import { Play, CheckCircle2, XCircle, MessageSquare, Lock, IndianRupee, ClipboardCheck } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { getClientById, getVideosByClient, MONTH_LABEL } from '../mock';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';

export default function ClientHome() {
  const { profile } = useAuth();
  const client = getClientById(profile?.client_id);
  const [items, setItems] = useState(() => (profile?.client_id ? getVideosByClient(profile.client_id) : []));
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const [note, setNote] = useState('');

  const monthLabel = `${MONTH_LABEL[5]} 2026`;

  const summary = useMemo(() => {
    return items.reduce((acc, v) => {
      acc.total += 1;
      if (v.client_status === 'Approved' || v.client_status === 'Posted') acc.approved += 1;
      if (v.editor_status === 'Sent To Client' && !['Approved','Correction','Rejected','Posted'].includes(v.client_status)) acc.review += 1;
      if (v.client_status === 'Approved' && v.client_locked) acc.billable += Number(v.amount || 0);
      return acc;
    }, { total: 0, approved: 0, review: 0, billable: 0 });
  }, [items]);

  const setStatus = (vid, status) => {
    setItems((prev) => prev.map((v) => v.id === vid ? { ...v, client_status: status } : v));
    toast.success(`${status} – thanks!`);
  };

  const submitCorrection = () => {
    if (!target) return;
    setStatus(target.id, 'Correction');
    setCorrectionOpen(false);
    setNote('');
    setTarget(null);
  };

  if (!client) {
    return <div className="p-8 text-[#7c9394]">No client mapped to this account.</div>;
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="rounded-xl border border-[#152223] bg-[#0a1112] p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#e6f7f6]">Welcome, {client.name}</h1>
            <p className="text-sm text-[#7c9394] mt-1">Review your videos for {monthLabel}, approve or request changes.</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="px-4 py-2 rounded-lg bg-[#0f1819] border border-[#243334]">
              <div className="text-[10px] uppercase text-[#6b8788] tracking-wider">Videos</div>
              <div className="text-lg font-semibold text-[#e6f7f6]">{summary.total}</div>
            </div>
            <div className="px-4 py-2 rounded-lg bg-[#0f1819] border border-[#243334]">
              <div className="text-[10px] uppercase text-[#6b8788] tracking-wider">In Review</div>
              <div className="text-lg font-semibold text-[#fbbf24]">{summary.review}</div>
            </div>
            <div className="px-4 py-2 rounded-lg bg-[#0f1819] border border-[#243334]">
              <div className="text-[10px] uppercase text-[#6b8788] tracking-wider">Approved</div>
              <div className="text-lg font-semibold text-[#4ade80]">{summary.approved}</div>
            </div>
            <div className="px-4 py-2 rounded-lg bg-[#0f1819] border border-[#243334]">
              <div className="text-[10px] uppercase text-[#6b8788] tracking-wider inline-flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Billable</div>
              <div className="text-lg font-semibold text-[#5eead4]">₹{summary.billable.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[#a8bcbd] text-sm">
        <ClipboardCheck className="w-4 h-4 text-[#5eead4]" /> {monthLabel} · {items.length} videos
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((v) => (
          <div key={v.id} className="rounded-xl border border-[#152223] bg-[#0a1112] overflow-hidden">
            <div className="relative aspect-video bg-[#050b0c] flex items-center justify-center border-b border-[#152223]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.09),transparent_65%)]" />
              <button onClick={() => toast('Preview (mock)')} className="relative w-14 h-14 rounded-full bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 fill-current" />
              </button>
              <div className="absolute top-3 left-3 text-[11px] px-2 py-0.5 rounded border border-[#243334] bg-[#0f1819]/70 text-[#a8bcbd] font-mono">{v.version}</div>
              <div className="absolute top-3 right-3"><StatusBadge status={v.client_status || (v.editor_status === 'Sent To Client' ? 'Pending Review' : v.editor_status)} /></div>
              <div className="absolute bottom-3 right-3 text-[11px] px-2 py-0.5 rounded bg-[#0f1819]/80 text-[#a8bcbd] tabular-nums">{v.duration}</div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[15px] font-semibold text-[#e6f7f6]">{v.name}</div>
                  <div className="text-xs text-[#6b8788] mt-0.5">{v.type}</div>
                </div>
                {v.client_locked && <span className="inline-flex items-center gap-1 text-[11px] text-[#5eead4]"><Lock className="w-3 h-3" /> Locked</span>}
              </div>
              {v.editor_status === 'Sent To Client' || v.editor_status === 'Done' ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={v.client_locked}
                    onClick={() => setStatus(v.id, 'Approved')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#1e5a3d] bg-[#0e2a1e] text-[#4ade80] text-xs font-medium hover:bg-[#123b2b] disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    disabled={v.client_locked}
                    onClick={() => { setTarget(v); setCorrectionOpen(true); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#5e3512] bg-[#2a1a0f] text-[#fb923c] text-xs font-medium hover:bg-[#3a2311] disabled:opacity-50"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Correction
                  </button>
                  <button
                    disabled={v.client_locked}
                    onClick={() => setStatus(v.id, 'Rejected')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#5b1e1e] bg-[#2a1414] text-[#f87171] text-xs font-medium hover:bg-[#3a1a1a] disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              ) : (
                <div className="text-xs text-[#6b8788]">Editor is still working on this video.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6]">
          <DialogHeader>
            <DialogTitle>Request Correction</DialogTitle>
            <DialogDescription className="text-[#7c9394]">What needs to change in {target?.name}?</DialogDescription>
          </DialogHeader>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Describe your changes…"
            className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm text-[#e6f7f6] placeholder-[#4b6162]"
          />
          <DialogFooter>
            <button onClick={() => setCorrectionOpen(false)} className="px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-sm text-[#a8bcbd] hover:bg-[#152223]">Cancel</button>
            <button onClick={submitCorrection} className="px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">Submit</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
