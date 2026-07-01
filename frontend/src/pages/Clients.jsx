import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Phone, Mail, ArrowRight, Users, KeyRound, Eye, EyeOff, Pencil, Trash2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { clients as ALL, videos, persist, uid } from '../lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { toast } from 'sonner';

function pendingFor(clientId) {
  return videos.filter((v) => v.client_id === clientId && (v.editor_status !== 'Done' || v.client_status === 'Correction' || v.client_status === 'Rejected')).length;
}

const emptyForm = { name: '', username: '', password: '', phone: '', email: '', monthlyFee: 0 };

export default function Clients() {
  const [q, setQ] = useState('');
  const [tick, setTick] = useState(0);
  const [reorderMode, setReorderMode] = useState(false);

  const [dialog, setDialog] = useState({ open: false, mode: 'new', clientId: null });
  const [deleting, setDeleting] = useState(null);

  const refresh = () => { persist(); setTick((n) => n + 1); };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filtered = useMemo(
    () => ALL.filter((c) => (c.name + c.username).toLowerCase().includes(q.toLowerCase())),
    [q, tick]
  );

  const move = (id, dir) => {
    const i = ALL.findIndex((c) => c.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= ALL.length) return;
    [ALL[i], ALL[j]] = [ALL[j], ALL[i]];
    refresh();
  };

  const openNew  = () => setDialog({ open: true, mode: 'new', clientId: null });
  const openEdit = (c) => setDialog({ open: true, mode: 'edit', clientId: c.id });

  const confirmDelete = () => {
    if (!deleting) return;
    const i = ALL.findIndex((c) => c.id === deleting.id);
    if (i >= 0) ALL.splice(i, 1);
    // Also purge that client's videos so the store stays consistent
    for (let k = videos.length - 1; k >= 0; k--) if (videos[k].client_id === deleting.id) videos.splice(k, 1);
    refresh();
    setDeleting(null);
    toast.success('Client removed');
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#e6f7f6] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#2dd4bf]" /> Clients
          </h1>
          <p className="text-sm text-[#7c9394] mt-1">Manage your studio&rsquo;s clients &mdash; edit, reorder or remove.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[#6b8788] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search clients&hellip;"
              className="focus-teal w-64 pl-9 pr-3 py-2 rounded-lg bg-[#0a1112] border border-[#243334] text-sm text-[#e6f7f6] placeholder-[#4b6162] transition-colors"
            />
          </div>
          <button
            onClick={() => setReorderMode((v) => !v)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors ${
              reorderMode ? 'border-[#2b2a55] bg-[#12122a] text-[#a8a5ff]' : 'border-[#243334] bg-[#0f1819] text-[#a8bcbd] hover:bg-[#152223]'
            }`}
          >
            <GripVertical className="w-4 h-4" /> {reorderMode ? 'Done reordering' : 'Reorder'}
          </button>
          <button onClick={openNew} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> New Client
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c, visibleIdx) => {
          const pend = pendingFor(c.id);
          const globalIdx = ALL.findIndex((x) => x.id === c.id);
          return (
            <div key={c.id} className="group relative rounded-xl border border-[#152223] bg-[#0a1112] p-5 hover:border-[#1e3a3b] hover:-translate-y-0.5 transition-all">
              {reorderMode && (
                <div className="absolute -top-2 -left-2 flex flex-col gap-1">
                  <button onClick={() => move(c.id, -1)} disabled={globalIdx === 0} className="p-1 rounded-md border border-[#243334] bg-[#0f1819] text-[#5eead4] hover:bg-[#152223] disabled:opacity-40 disabled:cursor-not-allowed">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => move(c.id, +1)} disabled={globalIdx === ALL.length - 1} className="p-1 rounded-md border border-[#243334] bg-[#0f1819] text-[#5eead4] hover:bg-[#152223] disabled:opacity-40 disabled:cursor-not-allowed">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0f3a37] to-[#0d2a28] border border-[#1e3a3b] flex items-center justify-center overflow-hidden shrink-0">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[#5eead4] font-semibold">{c.name.slice(0,1)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-[#e6f7f6] truncate">{c.name}</div>
                    <div className="text-[12px] text-[#7c9394] truncate">@{c.username}</div>
                  </div>
                </div>
                {pend > 0 ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-[#5c4711] bg-[#241d0f] text-[#fbbf24] whitespace-nowrap">{pend} pending</span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-[#1e5a3d] bg-[#0e2a1e] text-[#4ade80] whitespace-nowrap">All caught up</span>
                )}
              </div>

              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-[#a8bcbd]"><Phone className="w-3.5 h-3.5 text-[#6b8788]" /> {c.phone || '\u2014'}</div>
                <div className="flex items-center gap-2 text-[#a8bcbd] truncate"><Mail className="w-3.5 h-3.5 text-[#6b8788]" /> {c.email || '\u2014'}</div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#152223] flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#6b8788]">Monthly Fee</div>
                  <div className="text-[15px] font-semibold text-[#e6f7f6]">&#8377;{Number(c.monthlyFee).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    title="Edit client"
                    className="p-2 rounded-md text-[#a8bcbd] hover:text-[#e6f7f6] hover:bg-[#101a1b]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(c)}
                    title="Delete client"
                    className="p-2 rounded-md text-[#f87171] hover:bg-[#2a1414]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/admin/clients/${c.id}`}
                    className="inline-flex items-center gap-1 text-[13px] text-[#5eead4] hover:gap-2 transition-all ml-2"
                  >
                    Open <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-[#6b8788] bg-[#0a1112] border border-[#152223] rounded-xl">No clients match &ldquo;{q}&rdquo;.</div>
      )}

      <ClientDialog
        key={`${dialog.mode}-${dialog.clientId || 'new'}-${dialog.open}`}
        open={dialog.open}
        mode={dialog.mode}
        clientId={dialog.clientId}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSaved={refresh}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#7c9394]">
              This removes <span className="text-[#e6f7f6] font-semibold">{deleting?.name}</span> along with all their videos and history from this workspace. Expenses and invoices already generated will remain. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#0f1819] border-[#243334] text-[#a8bcbd] hover:bg-[#152223]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-[#7f1d1d] hover:bg-[#991b1b] text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ClientDialog({ open, mode, clientId, onClose, onSaved }) {
  const source = clientId ? ALL.find((c) => c.id === clientId) : null;
  const [form, setForm] = useState(() => source ? {
    name: source.name, username: source.username, password: source.password,
    phone: source.phone || '', email: source.email || '', monthlyFee: source.monthlyFee || 0,
  } : { ...emptyForm });
  const [showPw, setShowPw] = useState(false);

  const isEdit = mode === 'edit' && !!source;

  const save = () => {
    if (!form.name.trim())     return toast.error('Name is required');
    if (!form.username.trim()) return toast.error('Username is required');
    if (!isEdit && !form.password.trim()) return toast.error('Password is required');

    const uname = form.username.trim().toLowerCase();
    const dup = ALL.find((c) => c.username.toLowerCase() === uname && c.id !== (source?.id || ''));
    if (dup) return toast.error('Username already taken');

    if (isEdit) {
      source.name = form.name.trim();
      source.username = uname;
      if (form.password && form.password.trim()) source.password = form.password;
      source.phone = form.phone;
      source.email = form.email;
      source.monthlyFee = Number(form.monthlyFee) || 0;
      toast.success('Client updated');
    } else {
      ALL.push({
        id: uid('c'),
        name: form.name.trim(),
        username: uname,
        password: form.password,
        phone: form.phone,
        email: form.email,
        monthlyFee: Number(form.monthlyFee) || 0,
        active: true,
        logo_url: '',
      });
      toast.success('Client added \u2014 credentials ready');
    }
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6] max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Client' : 'New Client'}</DialogTitle>
          <DialogDescription className="text-[#7c9394]">
            {isEdit ? 'Update client details or reset portal credentials.' : 'Add a client and provision their portal credentials.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client Name" full value={form.name}       onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. ABC Fitness" />
          <Field label="Phone"             value={form.phone}      onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+91 …" />
          <Field label="Email"             value={form.email}      onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="team@brand.com" />
          <Field label="Monthly Fee (₹)" type="number" value={form.monthlyFee} onChange={(v) => setForm((f) => ({ ...f, monthlyFee: v }))} placeholder="0" />
          <div />
          <div className="col-span-2 mt-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#5eead4]">
            <KeyRound className="w-3.5 h-3.5" /> Portal Credentials
          </div>
          <Field label="Username" value={form.username} onChange={(v) => setForm((f) => ({ ...f, username: v.replace(/\s+/g, '').toLowerCase() }))} placeholder="e.g. abcfitness" />
          <div>
            <label className="block text-[12px] text-[#a8bcbd] mb-1">{isEdit ? 'New Password (leave blank to keep)' : 'Password'}</label>
            <div className="relative">
              <input
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                type={showPw ? 'text' : 'password'}
                placeholder={isEdit ? 'unchanged' : 'set a password'}
                className="focus-teal w-full px-3 py-2 pr-9 rounded-lg bg-[#070d0e] border border-[#243334] text-sm text-[#e6f7f6] placeholder-[#4b6162] transition-colors"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6b8788] hover:text-[#e6f7f6]">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <button onClick={onClose} className="px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-sm text-[#a8bcbd] hover:bg-[#152223]">Cancel</button>
          <button onClick={save} className="px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">
            {isEdit ? 'Save Changes' : 'Save Client'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', full }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-[12px] text-[#a8bcbd] mb-1">{label}</label>
      <input
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm text-[#e6f7f6] placeholder-[#4b6162] transition-colors"
      />
    </div>
  );
}
