import React, { useMemo, useState } from 'react';
import { Settings, User, Building2, Image as ImageIcon, DatabaseBackup, Eye, EyeOff, Save, Plus, Trash2, Upload, Download, Shield, KeyRound } from 'lucide-react';
import { admins, clients, settings, snapshotFor, persist, uid, MONTH_LABEL, availableYears } from '../mock';
import { fileToDataURL } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';

const TABS = [
  { key: 'admins',  label: 'Admin Users',   icon: Shield },
  { key: 'company', label: 'Company',       icon: Building2 },
  { key: 'logos',   label: 'Client Logos',  icon: ImageIcon },
  { key: 'backup',  label: 'Backup Data',   icon: DatabaseBackup },
];

export default function AccountSettings() {
  const [tab, setTab] = useState('admins');
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#e6f7f6] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#2dd4bf]" /> Account Settings
        </h1>
        <p className="text-sm text-[#7c9394] mt-1">Manage admin access, company details for invoices, client logos and data backups.</p>
      </div>

      <div className="inline-flex bg-[#0a1112] border border-[#243334] rounded-lg p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-[#0f2020] text-[#5eead4] border border-[#1e3a3b]' : 'text-[#a8bcbd] hover:text-[#e6f7f6]'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'admins'  && <AdminsTab />}
      {tab === 'company' && <CompanyTab />}
      {tab === 'logos'   && <ClientLogosTab />}
      {tab === 'backup'  && <BackupTab />}
    </div>
  );
}

/* -------------------- Admin users -------------------- */
function AdminsTab() {
  const { profile, signOut } = useAuth();
  const [tick, setTick] = useState(0);
  const refresh = () => { persist(); setTick((n) => n + 1); };

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', username: '', password: '' });

  const addAdmin = () => {
    if (!form.username.trim() || !form.password.trim()) return toast.error('Username and password required');
    if (admins.some((a) => a.username.toLowerCase() === form.username.trim().toLowerCase()))
      return toast.error('Username already exists');
    if (clients.some((c) => c.username.toLowerCase() === form.username.trim().toLowerCase()))
      return toast.error('Username already used by a client');
    admins.push({ id: uid('u'), username: form.username.trim().toLowerCase(), password: form.password, full_name: form.full_name.trim() || form.username, role: 'admin' });
    setForm({ full_name: '', username: '', password: '' });
    setOpen(false); refresh();
    toast.success('Admin created');
  };

  const remove = (a) => {
    if (a.username.toLowerCase() === profile?.username?.toLowerCase()) return toast.error("You can't remove yourself");
    if (admins.length <= 1) return toast.error('At least one admin required');
    const i = admins.findIndex((x) => x.id === a.id);
    if (i >= 0) { admins.splice(i, 1); refresh(); toast.success('Admin removed'); }
  };

  return (
    <div className="space-y-4">
      <MyCredentials onSaved={refresh} onLogout={signOut} />

      <div className="bg-[#0a1112] border border-[#152223] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#152223] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#e6f7f6] flex items-center gap-2"><Shield className="w-4 h-4 text-[#2dd4bf]" /> Admin Users</h3>
            <p className="text-xs text-[#6b8788] mt-0.5">All these users have full access to the admin console.</p>
          </div>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">
            <Plus className="w-4 h-4" /> Add Admin
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0d1516] text-[11px] uppercase tracking-wider text-[#6b8788]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Username</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152223]">
              {admins.map((a) => (
                <tr key={a.id} className="ev-row">
                  <td className="px-4 py-3 text-[#e6f7f6]">{a.full_name || '—'}</td>
                  <td className="px-4 py-3 text-[#a8bcbd]">@{a.username}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(a)} className="p-1.5 rounded-md text-[#f87171] hover:bg-[#2a1414]"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#6b8788]">You can also promote an existing client to an admin below (creates a fresh admin entry with the same username — clients keep working via their portal).</p>
      <PromoteClient onSaved={refresh} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6]">
          <DialogHeader><DialogTitle>New Admin</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="Full Name" value={form.full_name} onChange={(v) => setForm((f) => ({ ...f, full_name: v }))} />
            <Field label="Username"  value={form.username}  onChange={(v) => setForm((f) => ({ ...f, username: v.replace(/\s+/g, '').toLowerCase() }))} />
            <FieldPassword label="Password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} />
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-sm text-[#a8bcbd] hover:bg-[#152223]">Cancel</button>
            <button onClick={addAdmin} className="px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">Create Admin</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MyCredentials({ onSaved, onLogout }) {
  const { profile } = useAuth();
  const me = admins.find((a) => a.username.toLowerCase() === profile?.username?.toLowerCase());
  const [form, setForm] = useState({ username: me?.username || '', password: me?.password || '', full_name: me?.full_name || '' });

  const save = async () => {
    if (!me) return;
    if (!form.username.trim() || !form.password.trim()) return toast.error('Username and password required');
    const dup = admins.find((a) => a.id !== me.id && a.username.toLowerCase() === form.username.trim().toLowerCase());
    if (dup) return toast.error('Username already used');
    const changedUsername = me.username.toLowerCase() !== form.username.trim().toLowerCase();
    me.username = form.username.trim().toLowerCase();
    me.password = form.password;
    me.full_name = form.full_name.trim();
    onSaved();
    if (changedUsername) {
      toast.success('Credentials updated — please sign in again');
      setTimeout(() => onLogout && onLogout(), 800);
    } else {
      toast.success('Credentials updated');
    }
  };

  if (!me) return null;

  return (
    <div className="bg-[#0a1112] border border-[#152223] rounded-xl p-6">
      <h3 className="text-base font-semibold text-[#e6f7f6] flex items-center gap-2 mb-4"><KeyRound className="w-4 h-4 text-[#5eead4]" /> My Credentials</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Full Name" value={form.full_name} onChange={(v) => setForm((f) => ({ ...f, full_name: v }))} />
        <Field label="Username"  value={form.username}  onChange={(v) => setForm((f) => ({ ...f, username: v.replace(/\s+/g, '').toLowerCase() }))} />
        <FieldPassword label="Password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} />
      </div>
      <div className="mt-5">
        <button onClick={save} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold"><Save className="w-4 h-4" /> Save</button>
      </div>
    </div>
  );
}

function PromoteClient({ onSaved }) {
  const [selected, setSelected] = useState('');
  const promote = () => {
    const c = clients.find((x) => x.id === selected);
    if (!c) return toast.error('Pick a client');
    if (admins.some((a) => a.username.toLowerCase() === c.username.toLowerCase())) return toast.error('Already an admin');
    admins.push({ id: uid('u'), username: c.username, password: c.password, full_name: c.name, role: 'admin' });
    onSaved(); toast.success(`${c.name} promoted to admin`);
    setSelected('');
  };
  return (
    <div className="bg-[#0a1112] border border-[#152223] rounded-xl p-4 flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[220px]">
        <label className="block text-[12px] text-[#a8bcbd] mb-1">Promote client to admin</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm">
          <option value="">Select a client…</option>
          {clients.map((c) => (<option key={c.id} value={c.id}>{c.name} (@{c.username})</option>))}
        </select>
      </div>
      <button onClick={promote} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-sm text-[#5eead4] hover:bg-[#152223]">
        <Shield className="w-4 h-4" /> Make Admin
      </button>
    </div>
  );
}

/* -------------------- Company details -------------------- */
function CompanyTab() {
  const [form, setForm] = useState({ ...settings.company });
  const [logo, setLogo] = useState(settings.company.logo_url || '');
  const save = () => {
    Object.assign(settings.company, { ...form, logo_url: logo });
    persist(); toast.success('Company details saved');
  };
  const pickLogo = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1024 * 1024) return toast.error('Logo should be under 1MB');
    const url = await fileToDataURL(f);
    setLogo(url);
  };
  return (
    <div className="bg-[#0a1112] border border-[#152223] rounded-xl p-6">
      <h3 className="text-base font-semibold text-[#e6f7f6] flex items-center gap-2 mb-4"><Building2 className="w-4 h-4 text-[#5eead4]" /> Company Details</h3>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="shrink-0">
          <div className="w-40 h-40 rounded-xl border border-[#243334] bg-[#070d0e] flex items-center justify-center overflow-hidden">
            {logo ? <img src={logo} alt="logo" className="max-w-full max-h-full object-contain" /> : <ImageIcon className="w-8 h-8 text-[#4b6162]" />}
          </div>
          <label className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-sm text-[#a8bcbd] hover:bg-[#152223] cursor-pointer">
            <Upload className="w-4 h-4" /> Upload logo
            <input type="file" accept="image/*" onChange={pickLogo} className="hidden" />
          </label>
          {logo && <button onClick={() => setLogo('')} className="mt-2 block text-xs text-[#f87171] hover:underline">Remove logo</button>}
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Company Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <Field label="Website"      value={form.website} onChange={(v) => setForm((f) => ({ ...f, website: v }))} />
          <Field label="Email"        value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
          <Field label="Phone"        value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
          <Field label="GSTIN"        value={form.gstin} onChange={(v) => setForm((f) => ({ ...f, gstin: v }))} />
          <Field label="Invoice Prefix" value={form.invoice_prefix} onChange={(v) => setForm((f) => ({ ...f, invoice_prefix: v }))} />
          <div className="md:col-span-2">
            <label className="block text-[12px] text-[#a8bcbd] mb-1">Address</label>
            <textarea rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm" />
          </div>
          <Field label="Next Invoice #" type="number" value={form.next_invoice_number} onChange={(v) => setForm((f) => ({ ...f, next_invoice_number: Number(v) || 1 }))} />
        </div>
      </div>
      <div className="mt-6">
        <button onClick={save} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold"><Save className="w-4 h-4" /> Save Company</button>
      </div>
    </div>
  );
}

/* -------------------- Client logos -------------------- */
function ClientLogosTab() {
  const [tick, setTick] = useState(0);
  const refresh = () => { persist(); setTick((n) => n + 1); };

  const pick = async (c, e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1024 * 1024) return toast.error('Logo should be under 1MB');
    c.logo_url = await fileToDataURL(f);
    refresh(); toast.success(`${c.name} logo updated`);
  };
  const clear = (c) => { c.logo_url = ''; refresh(); };

  return (
    <div className="bg-[#0a1112] border border-[#152223] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#152223]">
        <h3 className="text-base font-semibold text-[#e6f7f6] flex items-center gap-2"><ImageIcon className="w-4 h-4 text-[#5eead4]" /> Client Logos</h3>
        <p className="text-xs text-[#6b8788] mt-0.5">Shown on the client portal header and invoices.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
        {clients.map((c) => (
          <div key={c.id} className="rounded-lg border border-[#152223] bg-[#0d1516] p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg border border-[#243334] bg-[#070d0e] flex items-center justify-center overflow-hidden shrink-0">
              {c.logo_url ? <img src={c.logo_url} alt="" className="max-w-full max-h-full object-contain" /> : <span className="text-[#5eead4] font-semibold">{c.name.slice(0,1)}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#e6f7f6] truncate">{c.name}</div>
              <div className="text-[11px] text-[#7c9394] truncate">@{c.username}</div>
              <div className="mt-2 flex gap-2">
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#243334] bg-[#0f1819] text-xs text-[#a8bcbd] hover:bg-[#152223] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(c, e)} />
                </label>
                {c.logo_url && <button onClick={() => clear(c)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded border border-[#243334] text-[#f87171] hover:bg-[#2a1414]"><Trash2 className="w-3 h-3" /> Clear</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Backup -------------------- */
function BackupTab() {
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(0);
  const years = availableYears();

  const snap = useMemo(() => clientId ? snapshotFor({ clientId, year, month }) : null, [clientId, year, month]);

  const download = (blob, filename) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const toCSV = (rows, headers) => {
    const esc = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const head = headers.join(',');
    const body = rows.map((r) => headers.map((h) => esc(r[h])).join(',')).join('\n');
    return head + '\n' + body;
  };

  const monthLabel = month === 0 ? `All-${year}` : `${MONTH_LABEL[month-1]}-${year}`;

  const downloadJSON = () => {
    if (!snap) return;
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    download(blob, `EditVault_${snap.client?.username || 'client'}_${monthLabel}.json`);
  };

  const downloadCSV = () => {
    if (!snap) return;
    const files = [
      { name: 'videos.csv',   text: toCSV(snap.videos,   ['id','name','file_name','category','duration','version','editor_status','client_status','posted_date','amount','year','month']) },
      { name: 'expenses.csv', text: toCSV(snap.expenses, ['id','date','description','amount','status','year','month']) },
      { name: 'bills.csv',    text: toCSV(snap.bills,    ['id','invoice_no','year','month','subtotal','discount','tax','total_amount','status','generated_at']) },
    ];
    // Combine into one file with section headers (a lightweight multi-sheet CSV)
    const combined = files.map((f) => `# ${f.name}\n${f.text}`).join('\n\n');
    const blob = new Blob([combined], { type: 'text/csv' });
    download(blob, `EditVault_${snap.client?.username || 'client'}_${monthLabel}.csv`);
  };

  return (
    <div className="bg-[#0a1112] border border-[#152223] rounded-xl p-6">
      <h3 className="text-base font-semibold text-[#e6f7f6] flex items-center gap-2 mb-4"><DatabaseBackup className="w-4 h-4 text-[#5eead4]" /> Backup Data</h3>
      <p className="text-sm text-[#7c9394] mb-4">Export a client’s videos, expenses and bills for a given period as JSON or CSV.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
        <div>
          <label className="block text-[12px] text-[#a8bcbd] mb-1">Client</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm">
            {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-[12px] text-[#a8bcbd] mb-1">Month</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm">
            <option value={0}>All months</option>
            {MONTH_LABEL.map((m, i) => (<option key={m} value={i + 1}>{m}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-[12px] text-[#a8bcbd] mb-1">Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm">
            {years.map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
        </div>
      </div>

      {snap && (
        <div className="mt-5 grid grid-cols-3 gap-3 max-w-3xl">
          <SmallStat label="Videos"   value={snap.videos.length} />
          <SmallStat label="Expenses" value={snap.expenses.length} />
          <SmallStat label="Bills"    value={snap.bills.length} />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={downloadJSON} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold"><Download className="w-4 h-4" /> Download JSON</button>
        <button onClick={downloadCSV} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-sm text-[#5eead4] hover:bg-[#152223]"><Download className="w-4 h-4" /> Download CSV</button>
      </div>
    </div>
  );
}

function SmallStat({ label, value }) {
  return (
    <div className="px-4 py-2 rounded-lg bg-[#0f1819] border border-[#243334]">
      <div className="text-[10px] uppercase text-[#6b8788] tracking-wider">{label}</div>
      <div className="text-lg font-semibold text-[#e6f7f6]">{value}</div>
    </div>
  );
}

/* -------------------- Shared fields -------------------- */
function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-[12px] text-[#a8bcbd] mb-1">{label}</label>
      <input value={value} type={type} onChange={(e) => onChange(e.target.value)} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm" />
    </div>
  );
}
function FieldPassword({ label, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-[12px] text-[#a8bcbd] mb-1">{label}</label>
      <div className="relative">
        <input value={value} type={show ? 'text' : 'password'} onChange={(e) => onChange(e.target.value)} className="focus-teal w-full px-3 py-2 pr-9 rounded-lg bg-[#070d0e] border border-[#243334] text-sm" />
        <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6b8788] hover:text-[#e6f7f6]">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
