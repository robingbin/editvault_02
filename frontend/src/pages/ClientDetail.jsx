import React, { useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, IndianRupee, Plus, Play, Pencil, Trash2, Video, KeyRound, Wallet, ReceiptText, FileText, FilePlus2, Check, X as XIcon, Save, Eye, EyeOff, Copy, Download } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import MonthYearFilter from '../components/MonthYearFilter';
import { clients, getClientById, getVideosByClient, getExpensesByClient, getBillsByClient, videos as ALL_VIDEOS, expenses as ALL_EXP, bills as ALL_BILLS, categories as CATS, MONTH_LABEL, persist, uid } from '../mock';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';

const TABS = [
  { key: 'videos',   label: 'Videos',       icon: Video },
  { key: 'expenses', label: 'Expenses',     icon: Wallet },
  { key: 'billing',  label: 'Billing',      icon: ReceiptText },
  { key: 'access',   label: 'Access',       icon: KeyRound },
];

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = getClientById(id);
  const [tab, setTab] = useState('videos');
  const [filter, setFilter] = useState({ month: 6, year: 2026 });
  const [tick, setTick] = useState(0);

  const inMonth = React.useCallback((y, m) => (filter.month === 0 ? y === filter.year : y === filter.year && m === filter.month), [filter]);
  const vList  = useMemo(() => client ? getVideosByClient(client.id).filter((v) => inMonth(v.year, v.month)) : [],   [client, filter, tick, inMonth]);
  const eList  = useMemo(() => client ? getExpensesByClient(client.id).filter((e) => inMonth(e.year, e.month)) : [], [client, filter, tick, inMonth]);
  const bList  = useMemo(() => client ? getBillsByClient(client.id).filter((b) => inMonth(b.year, b.month)) : [],    [client, filter, tick, inMonth]);

  const totals = useMemo(() => {
    const amt = vList.reduce((a, v) => a + Number(v.amount || 0), 0);
    const billable = vList.filter((v) => v.client_status === 'Approved' && v.client_locked).reduce((a, v) => a + Number(v.amount || 0), 0);
    const paid = eList.filter((e) => e.status === 'Paid').reduce((a, e) => a + Number(e.amount || 0), 0);
    const outstanding = eList.filter((e) => e.status !== 'Paid').reduce((a, e) => a + Number(e.amount || 0), 0);
    return { count: vList.length, amount: amt, billable, paid, outstanding };
  }, [vList, eList]);

  const refresh = () => { persist(); setTick((n) => n + 1); };

  if (!client) {
    return <div className="p-8 text-center text-[#7c9394]">Client not found. <Link className="text-[#2dd4bf]" to="/admin/clients">Back to clients</Link></div>;
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      <button onClick={() => navigate('/admin/clients')} className="inline-flex items-center gap-2 text-sm text-[#a8bcbd] hover:text-[#e6f7f6]">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </button>

      <div className="relative rounded-xl border border-[#152223] bg-[#0a1112] p-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.08),transparent_50%)]" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f3a37] to-[#0d2a28] border border-[#1e3a3b] flex items-center justify-center text-2xl text-[#5eead4] font-semibold">{client.name.slice(0,1)}</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-[#e6f7f6]">{client.name}</h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#a8bcbd]">
              <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#6b8788]" />{client.phone || '—'}</span>
              <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#6b8788]" />{client.email || '—'}</span>
              <span className="inline-flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5 text-[#6b8788]" />{client.monthlyFee.toLocaleString()} / month</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatMini label="Videos"      value={totals.count} />
            <StatMini label="Billed"      value={`₹${totals.paid.toLocaleString()}`} tone="green" />
            <StatMini label="Outstanding" value={`₹${totals.outstanding.toLocaleString()}`} tone="amber" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="inline-flex bg-[#0a1112] border border-[#243334] rounded-lg p-1 overflow-x-auto">
          {TABS.map((t) => (
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

      {tab === 'videos'   && <VideosTab   client={client} videos={vList} refresh={refresh} filter={filter} />}
      {tab === 'expenses' && <ExpensesTab client={client} expenses={eList} refresh={refresh} filter={filter} />}
      {tab === 'billing'  && <BillingTab  client={client} videos={vList} expenses={eList} bills={bList} refresh={refresh} filter={filter} />}
      {tab === 'access'   && <AccessTab   client={client} refresh={refresh} />}
    </div>
  );
}

function StatMini({ label, value, tone = 'default' }) {
  const color = tone === 'green' ? 'text-[#4ade80]' : tone === 'amber' ? 'text-[#fbbf24]' : 'text-[#e6f7f6]';
  return (
    <div className="px-4 py-2 rounded-lg bg-[#0f1819] border border-[#243334] min-w-[110px]">
      <div className="text-[10px] uppercase text-[#6b8788] tracking-wider">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
    </div>
  );
}

/* -------------------------- VIDEOS TAB -------------------------- */
function VideosTab({ client, videos, refresh, filter }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [postedEdit, setPostedEdit] = useState({ id: null, value: '' });

  const remove = (v) => {
    const i = ALL_VIDEOS.findIndex((x) => x.id === v.id);
    if (i >= 0) { ALL_VIDEOS.splice(i, 1); refresh(); toast.success('Video removed'); }
  };

  const savePosted = (v) => {
    v.posted_date = postedEdit.value || null;
    if (v.posted_date) { v.client_status = 'Posted'; v.client_locked = true; }
    setPostedEdit({ id: null, value: '' });
    refresh();
    toast.success('Posted date updated');
  };

  const displayLabel = filter.month === 0 ? `${filter.year}` : `${MONTH_LABEL[filter.month-1]} ${filter.year}`;

  return (
    <>
      <div className="flex justify-end -mt-2">
        <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="bg-[#0a1112] border border-[#152223] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#152223]">
          <h3 className="text-base font-semibold text-[#e6f7f6] flex items-center gap-2"><Video className="w-4 h-4 text-[#2dd4bf]" /> Videos — {displayLabel}</h3>
          <p className="text-xs text-[#6b8788] mt-0.5">All items worked on during this period</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0d1516] text-[11px] uppercase tracking-wider text-[#6b8788]">
              <tr>
                <th className="text-left px-4 py-3 font-medium w-10">#</th>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Duration</th>
                <th className="text-left px-4 py-3 font-medium">Ver</th>
                <th className="text-left px-4 py-3 font-medium">Editor</th>
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">Posted Date</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152223]">
              {videos.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-[#6b8788]">No items in this period.</td></tr>
              ) : videos.map((v, idx) => (
                <tr key={v.id} className="ev-row">
                  <td className="px-4 py-3 text-[#6b8788]">{idx + 1}</td>
                  <td className="px-4 py-3 text-[#e6f7f6]">{v.name}</td>
                  <td className="px-4 py-3 text-[#a8bcbd]">{v.category}</td>
                  <td className="px-4 py-3 text-[#a8bcbd] tabular-nums">{v.duration}</td>
                  <td className="px-4 py-3"><span className="text-[11px] px-1.5 py-0.5 rounded border border-[#243334] bg-[#0f1819] text-[#a8bcbd] font-mono">{v.version}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={v.editor_status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={v.client_status} /></td>
                  <td className="px-4 py-3">
                    {postedEdit.id === v.id ? (
                      <div className="flex items-center gap-1.5">
                        <input type="date" value={postedEdit.value} onChange={(e) => setPostedEdit((s) => ({ ...s, value: e.target.value }))} className="focus-teal bg-[#070d0e] border border-[#243334] text-xs text-[#e6f7f6] rounded px-2 py-1" />
                        <button onClick={() => savePosted(v)} className="p-1 rounded text-[#4ade80] hover:bg-[#0e2a1e]"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setPostedEdit({ id: null, value: '' })} className="p-1 rounded text-[#f87171] hover:bg-[#2a1414]"><XIcon className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <button onClick={() => setPostedEdit({ id: v.id, value: v.posted_date || '' })} className="text-[#7c9394] hover:text-[#5eead4] text-xs inline-flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> {v.posted_date || 'Set date'}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-[#e6f7f6] tabular-nums">₹{v.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toast('Preview (mock)')} className="p-1.5 rounded-md text-[#5eead4] hover:bg-[#0f2020]"><Play className="w-4 h-4" /></button>
                      <button onClick={() => setEditing(v)} className="p-1.5 rounded-md text-[#a8bcbd] hover:bg-[#101a1b]"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => remove(v)} className="p-1.5 rounded-md text-[#f87171] hover:bg-[#2a1414]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <VideoDialog open={addOpen} onOpenChange={setAddOpen} client={client} filter={filter} onSaved={refresh} />
      <VideoDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} client={client} filter={filter} onSaved={refresh} editing={editing} />
    </>
  );
}

function VideoDialog({ open, onOpenChange, client, filter, onSaved, editing }) {
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [form, setForm] = useState(() => editing || {
    name: '', category: CATS[0], duration: '00:30', version: 'V1',
    editor_status: 'Not Started', client_status: null, amount: 0,
    year: filter.year, month: filter.month || (new Date().getMonth() + 1),
  });
  React.useEffect(() => { if (editing) setForm(editing); }, [editing]);

  const save = () => {
    if (!form.name.trim()) return toast.error('Name required');
    if (editing) {
      Object.assign(editing, form);
    } else {
      ALL_VIDEOS.push({ id: uid('v'), client_id: client.id, client_locked: false, posted_date: null, due_date: `${MONTH_LABEL[(form.month || 1) - 1]} ${form.year}`, ...form, amount: Number(form.amount) || 0 });
    }
    onSaved();
    onOpenChange(false);
    toast.success(editing ? 'Updated' : 'Added');
  };

  const addCategory = () => {
    const c = newCat.trim();
    if (!c) return;
    if (!CATS.includes(c)) CATS.push(c);
    setForm((f) => ({ ...f, category: c }));
    setNewCat(''); setAddingCat(false);
    persist();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6] max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Item' : 'Add Item'}</DialogTitle>
          <DialogDescription className="text-[#7c9394]">Video, poster, thumbnail, motion graphics — anything you edit.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <FieldWrap label="Name" full>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm" placeholder="e.g. Diwali Reel 01" />
          </FieldWrap>
          <FieldWrap label="Category" full>
            {addingCat ? (
              <div className="flex gap-2">
                <input autoFocus value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category" className="focus-teal flex-1 px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm" />
                <button onClick={addCategory} className="px-3 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">Add</button>
                <button onClick={() => { setAddingCat(false); setNewCat(''); }} className="px-3 rounded-lg border border-[#243334] text-sm text-[#a8bcbd] hover:bg-[#152223]">Cancel</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="focus-teal flex-1 px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm">
                  {CATS.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
                <button onClick={() => setAddingCat(true)} className="inline-flex items-center gap-1 px-3 rounded-lg border border-[#243334] text-sm text-[#5eead4] hover:bg-[#0f2020]"><Plus className="w-3.5 h-3.5" /> Custom</button>
              </div>
            )}
          </FieldWrap>
          <FieldWrap label="Duration"><input value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm" placeholder="00:30" /></FieldWrap>
          <FieldWrap label="Version"><input value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm" placeholder="V1" /></FieldWrap>
          <FieldWrap label="Month">
            <select value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm">
              {MONTH_LABEL.map((m, i) => (<option key={m} value={i + 1}>{m}</option>))}
            </select>
          </FieldWrap>
          <FieldWrap label="Year"><input type="number" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm" /></FieldWrap>
          <FieldWrap label="Editor Status">
            <select value={form.editor_status} onChange={(e) => setForm((f) => ({ ...f, editor_status: e.target.value }))} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm">
              {['Not Started', 'In Progress', 'Sent To Client', 'Done'].map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </FieldWrap>
          <FieldWrap label="Amount (₹)"><input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm" /></FieldWrap>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-sm text-[#a8bcbd] hover:bg-[#152223]">Cancel</button>
          <button onClick={save} className="px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">Save</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldWrap({ label, children, full }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-[12px] text-[#a8bcbd] mb-1">{label}</label>
      {children}
    </div>
  );
}

/* -------------------------- EXPENSES TAB -------------------------- */
function ExpensesTab({ client, expenses, refresh, filter }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), description: '', amount: 0, status: 'Unpaid' });

  const save = () => {
    if (!form.description.trim()) return toast.error('Description required');
    const d = new Date(form.date);
    ALL_EXP.push({ id: uid('e'), client_id: client.id, date: form.date, description: form.description.trim(), amount: Number(form.amount) || 0, status: form.status, year: d.getFullYear(), month: d.getMonth() + 1 });
    setForm({ date: new Date().toISOString().slice(0,10), description: '', amount: 0, status: 'Unpaid' });
    setOpen(false); refresh();
    toast.success('Expense added');
  };

  const toggleStatus = (e) => { e.status = e.status === 'Paid' ? 'Unpaid' : 'Paid'; refresh(); };
  const remove = (e) => { const i = ALL_EXP.findIndex((x) => x.id === e.id); if (i >= 0) { ALL_EXP.splice(i, 1); refresh(); } };

  const totals = expenses.reduce((a, e) => { a.total += Number(e.amount || 0); if (e.status === 'Paid') a.paid += Number(e.amount || 0); else a.due += Number(e.amount || 0); return a; }, { total: 0, paid: 0, due: 0 });

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatMini label="Total Billed" value={`₹${totals.total.toLocaleString()}`} />
        <StatMini label="Total Paid"   value={`₹${totals.paid.toLocaleString()}`} tone="green" />
        <StatMini label="Outstanding"  value={`₹${totals.due.toLocaleString()}`} tone="amber" />
      </div>

      <div className="flex justify-end">
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div className="bg-[#0a1112] border border-[#152223] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0d1516] text-[11px] uppercase tracking-wider text-[#6b8788]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152223]">
              {expenses.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[#6b8788]">No expenses in this period.</td></tr>
              ) : expenses.map((e) => (
                <tr key={e.id} className="ev-row">
                  <td className="px-4 py-3 text-[#a8bcbd] tabular-nums">{e.date}</td>
                  <td className="px-4 py-3 text-[#e6f7f6]">{e.description}</td>
                  <td className="px-4 py-3 text-right text-[#e6f7f6] tabular-nums">₹{Number(e.amount).toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleStatus(e)} title="Toggle Paid/Unpaid" className="p-1.5 rounded-md text-[#5eead4] hover:bg-[#0f2020]"><Check className="w-4 h-4" /></button>
                      <button onClick={() => remove(e)} className="p-1.5 rounded-md text-[#f87171] hover:bg-[#2a1414]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6]">
          <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <FieldWrap label="Date"><input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm" /></FieldWrap>
            <FieldWrap label="Amount (₹)"><input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm" /></FieldWrap>
            <FieldWrap label="Description" full><input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm" placeholder="e.g. Thumbnail design" /></FieldWrap>
            <FieldWrap label="Status">
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm">
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </FieldWrap>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-sm text-[#a8bcbd] hover:bg-[#152223]">Cancel</button>
            <button onClick={save} className="px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------------- BILLING TAB -------------------------- */
function BillingTab({ client, videos, expenses, bills, refresh, filter }) {
  const [open, setOpen] = useState(false);
  const autoSum = useMemo(() => {
    const fromVideos = videos.filter((v) => v.client_status === 'Approved' && v.client_locked).reduce((a, v) => a + Number(v.amount || 0), 0);
    const fromExp    = expenses.reduce((a, e) => a + Number(e.amount || 0), 0);
    return fromVideos + fromExp;
  }, [videos, expenses]);

  const [total, setTotal] = useState(autoSum);
  React.useEffect(() => { setTotal(autoSum); }, [autoSum]);

  const [year, month] = [filter.year, filter.month === 0 ? new Date().getMonth() + 1 : filter.month];

  const existing = bills.find((b) => b.year === year && b.month === month);

  const generate = () => {
    if (existing) {
      existing.total_amount = Number(total) || 0;
      existing.generated_at = new Date().toISOString().slice(0,10);
      toast.success('Bill updated');
    } else {
      ALL_BILLS.push({ id: uid('b'), client_id: client.id, year, month, total_amount: Number(total) || 0, status: 'Pending', generated_at: new Date().toISOString().slice(0,10), invoice_url: '#' });
      toast.success('Bill generated');
    }
    setOpen(false); refresh();
  };

  const markPaid = (b) => { b.status = b.status === 'Paid' ? 'Pending' : 'Paid'; refresh(); toast.success(`Marked ${b.status}`); };

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">
          <FilePlus2 className="w-4 h-4" /> Generate Bill for {MONTH_LABEL[month-1]} {year}
        </button>
      </div>

      <div className="bg-[#0a1112] border border-[#152223] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#152223]">
          <h3 className="text-base font-semibold text-[#e6f7f6] flex items-center gap-2"><ReceiptText className="w-4 h-4 text-[#2dd4bf]" /> Bills</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0d1516] text-[11px] uppercase tracking-wider text-[#6b8788]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Period</th>
                <th className="text-left px-4 py-3 font-medium">Generated</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152223]">
              {bills.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[#6b8788]">No bills for this period.</td></tr>
              ) : bills.map((b) => (
                <tr key={b.id} className="ev-row">
                  <td className="px-4 py-3 text-[#e6f7f6]">{MONTH_LABEL[b.month-1]} {b.year}</td>
                  <td className="px-4 py-3 text-[#a8bcbd]">{b.generated_at}</td>
                  <td className="px-4 py-3 text-right text-[#e6f7f6] tabular-nums">₹{Number(b.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => toast('Invoice download (mock)')} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-[#243334] bg-[#0f1819] text-[#a8bcbd] hover:bg-[#152223]"><Download className="w-3 h-3" /> Invoice</button>
                      <button onClick={() => markPaid(b)} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${b.status === 'Paid' ? 'border-[#5c4711] bg-[#241d0f] text-[#fbbf24]' : 'border-[#1e5a3d] bg-[#0e2a1e] text-[#4ade80]'} hover:opacity-90`}>
                        <Check className="w-3 h-3" /> {b.status === 'Paid' ? 'Mark Pending' : 'Mark Paid'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6]">
          <DialogHeader>
            <DialogTitle>Generate Bill — {MONTH_LABEL[month-1]} {year}</DialogTitle>
            <DialogDescription className="text-[#7c9394]">Pre-filled from Approved videos + expenses. Edit if needed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="px-3 py-2 rounded-lg bg-[#0f1819] border border-[#243334] text-sm text-[#a8bcbd] flex justify-between">
              <span>Auto-sum (videos + expenses)</span>
              <span className="text-[#5eead4] tabular-nums">₹{autoSum.toLocaleString()}</span>
            </div>
            <FieldWrap label="Total Amount (₹)">
              <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm" />
            </FieldWrap>
            {existing && <div className="text-xs text-[#fbbf24]">A bill already exists for this period. Saving will update it.</div>}
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-sm text-[#a8bcbd] hover:bg-[#152223]">Cancel</button>
            <button onClick={generate} className="px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">Save Bill</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------------- ACCESS TAB -------------------------- */
function AccessTab({ client, refresh }) {
  const [form, setForm] = useState({ username: client.username, password: client.password });
  const [showPw, setShowPw] = useState(false);

  const save = () => {
    if (!form.username.trim() || !form.password.trim()) return toast.error('Both fields required');
    const dup = clients.find((c) => c.id !== client.id && c.username.toLowerCase() === form.username.trim().toLowerCase());
    if (dup) return toast.error('Username already used');
    client.username = form.username.trim().toLowerCase();
    client.password = form.password;
    refresh();
    toast.success('Credentials updated');
  };

  const copy = () => {
    navigator.clipboard?.writeText(`Username: ${client.username}\nPassword: ${client.password}`);
    toast.success('Credentials copied');
  };

  return (
    <div className="bg-[#0a1112] border border-[#152223] rounded-xl p-6 max-w-xl">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound className="w-4 h-4 text-[#5eead4]" />
        <h3 className="text-base font-semibold text-[#e6f7f6]">Portal Credentials</h3>
      </div>
      <p className="text-sm text-[#7c9394] mb-4">The client uses these to sign into their portal. You can change them anytime.</p>
      <div className="grid grid-cols-2 gap-3">
        <FieldWrap label="Username" full>
          <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.replace(/\s+/g, '').toLowerCase() }))} className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm" />
        </FieldWrap>
        <FieldWrap label="Password" full>
          <div className="relative">
            <input value={form.password} type={showPw ? 'text' : 'password'} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="focus-teal w-full px-3 py-2 pr-9 rounded-lg bg-[#070d0e] border border-[#243334] text-sm" />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6b8788] hover:text-[#e6f7f6]">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FieldWrap>
      </div>
      <div className="mt-5 flex items-center gap-2">
        <button onClick={save} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold"><Save className="w-4 h-4" /> Save</button>
        <button onClick={copy} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-sm text-[#a8bcbd] hover:bg-[#152223]"><Copy className="w-4 h-4" /> Copy</button>
      </div>
    </div>
  );
}
