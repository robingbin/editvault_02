import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle2, XCircle, MessageSquare, Lock, ShieldCheck } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { getClientById, getVideosByClient } from '../mock';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';

export default function ClientPortalDetail() {
  const { id } = useParams();
  const client = getClientById(id);
  const initial = useMemo(() => getVideosByClient(id).filter((v) => v.editor_status === 'Sent To Client' || v.editor_status === 'Done'), [id]);
  const [items, setItems] = useState(initial);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const [note, setNote] = useState('');

  if (!client) {
    return <div className="p-8 text-center text-[#7c9394]">Client not found. <Link className="text-[#2dd4bf]" to="/admin/portal">Back</Link></div>;
  }

  const setStatus = (vid, status) => {
    setItems((prev) => prev.map((v) => v.id === vid ? { ...v, client_status: status } : v));
    toast.success(`Marked ${status}`);
  };

  const submitCorrection = () => {
    if (!target) return;
    setStatus(target.id, 'Correction');
    setCorrectionOpen(false);
    setNote('');
    setTarget(null);
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
            <p className="text-sm text-[#7c7cb0]">Approve, request corrections or reject videos submitted for review.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#2b2a55] bg-[#0d0d20] text-[#a8a5ff] text-xs">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin Preview
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((v) => (
          <div key={v.id} className="rounded-xl border border-[#152223] bg-[#0a1112] overflow-hidden group">
            <div className="relative aspect-video bg-[#050b0c] flex items-center justify-center border-b border-[#152223]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.09),transparent_65%)]" />
              <button onClick={() => toast('Preview player (mock)')} className="relative w-14 h-14 rounded-full bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 fill-current" />
              </button>
              <div className="absolute top-3 left-3 text-[11px] px-2 py-0.5 rounded border border-[#243334] bg-[#0f1819]/70 text-[#a8bcbd] font-mono">{v.version}</div>
              <div className="absolute top-3 right-3"><StatusBadge status={v.client_status || 'Pending Review'} /></div>
              <div className="absolute bottom-3 right-3 text-[11px] px-2 py-0.5 rounded bg-[#0f1819]/80 text-[#a8bcbd] tabular-nums">{v.duration}</div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[15px] font-semibold text-[#e6f7f6]">{v.name}</div>
                  <div className="text-xs text-[#6b8788] mt-0.5">{v.type} · ₹{v.amount.toLocaleString()}</div>
                </div>
                {v.client_locked && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#5eead4]"><Lock className="w-3 h-3" /> Locked</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  disabled={v.client_locked}
                  onClick={() => setStatus(v.id, 'Approved')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#1e5a3d] bg-[#0e2a1e] text-[#4ade80] text-xs font-medium hover:bg-[#123b2b] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  disabled={v.client_locked}
                  onClick={() => { setTarget(v); setCorrectionOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#5e3512] bg-[#2a1a0f] text-[#fb923c] text-xs font-medium hover:bg-[#3a2311] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Correction
                </button>
                <button
                  disabled={v.client_locked}
                  onClick={() => setStatus(v.id, 'Rejected')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#5b1e1e] bg-[#2a1414] text-[#f87171] text-xs font-medium hover:bg-[#3a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="md:col-span-2 text-center py-16 text-[#6b8788] bg-[#0a1112] border border-[#152223] rounded-xl">
            No videos are currently pending review for this client.
          </div>
        )}
      </div>

      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6]">
          <DialogHeader>
            <DialogTitle>Request Correction</DialogTitle>
            <DialogDescription className="text-[#7c9394]">Add a note for {target?.name}.</DialogDescription>
          </DialogHeader>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Describe what needs to change…"
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
