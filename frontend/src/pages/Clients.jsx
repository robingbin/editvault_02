import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Phone, Mail, ArrowRight, Users, KeyRound, Eye, EyeOff, X } from 'lucide-react';
import { clients as ALL, videos, persist, uid } from '../mock';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';

function pendingFor(clientId) {
  return videos.filter((v) => v.client_id === clientId && (v.editor_status !== 'Done' || v.client_status === 'Correction' || v.client_status === 'Rejected')).length;
}

export default function Clients() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', password: '', phone: '', email: '', monthlyFee: 0 });

  const filtered = useMemo(
    () => ALL.filter((c) => (c.name + c.username).toLowerCase().includes(q.toLowerCase())),
    [q, tick]
  );

  const canSave = form.name.trim() && form.username.trim() && form.password.trim();

  const save = () => {
    if (!canSave) return toast.error('Name, Username and Password are required.');
    if (ALL.some((c) => c.username.toLowerCase() === form.username.trim().toLowerCase())) {
      return toast.error('Username already taken.');
    }
    ALL.push({
      id: uid('c'),
      name: form.name.trim(),
      username: form.username.trim().toLowerCase(),
      password: form.password,
      phone: form.phone,
      email: form.email,
      monthlyFee: Number(form.monthlyFee) || 0,
      active: true,
    });
    persist();
    setForm({ name: '', username: '', password: '', phone: '', email: '', monthlyFee: 0 });
    setOpen(false);
    setTick((n) => n + 1);
    toast.success('Client added — credentials ready.');
  };

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
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold transition-colors">
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
                <div className="flex items-center gap-2 text-[#a8bcbd]"><Phone className="w-3.5 h-3.5 text-[#6b8788]" /> {c.phone || '—'}</div>
                <div className="flex items-center gap-2 text-[#a8bcbd] truncate"><Mail className="w-3.5 h-3.5 text-[#6b8788]" /> {c.email || '—'}</div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#152223] flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#6b8788]">Monthly Fee</div>
                  <div className="text-[15px] font-semibold text-[#e6f7f6]">₹{Number(c.monthlyFee).toLocaleString()}</div>
                </div>
                <div className="inline-flex items-center gap-1 text-[13px] text-[#5eead4] group-hover:gap-2 transition-all">Open <ArrowRight className="w-4 h-4" /></div>
              </div>
            </Link>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-[#6b8788] bg-[#0a1112] border border-[#152223] rounded-xl">No clients match “{q}”.</div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6] max-w-lg">
          <DialogHeader>
            <DialogTitle>New Client</DialogTitle>
            <DialogDescription className="text-[#7c9394]">Add a client and provision their portal credentials.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client Name"  value={form.name}       onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. ABC Fitness" full />
            <Field label="Phone"        value={form.phone}      onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+91 …" />
            <Field label="Email"        value={form.email}      onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="team@brand.com" />
            <Field label="Monthly Fee (₹)" type="number" value={form.monthlyFee} onChange={(v) => setForm((f) => ({ ...f, monthlyFee: v }))} placeholder="0" />
            <div />
            <div className="col-span-2 mt-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#5eead4]">
              <KeyRound className="w-3.5 h-3.5" /> Portal Credentials
            </div>
            <Field label="Username"     value={form.username}   onChange={(v) => setForm((f) => ({ ...f, username: v.replace(/\s+/g, '').toLowerCase() }))} placeholder="e.g. abcfitness" />
            <div>
              <label className="block text-[12px] text-[#a8bcbd] mb-1">Password</label>
              <div className="relative">
                <input
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  type={showPw ? 'text' : 'password'}
                  placeholder="set a password"
                  className="focus-teal w-full px-3 py-2 pr-9 rounded-lg bg-[#070d0e] border border-[#243334] text-sm text-[#e6f7f6] placeholder-[#4b6162] transition-colors"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6b8788] hover:text-[#e6f7f6]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-sm text-[#a8bcbd] hover:bg-[#152223]">Cancel</button>
            <button onClick={save} className="px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">Save Client</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
