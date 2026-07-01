// EditVault data store — API-backed replacement for the legacy mock.js.
//
// Design goals:
//   * Preserve the same *exported* surface (mutable arrays + helpers) so the UI
//     pages didn't need to be rewritten to a hooks-based data layer.
//   * `initStore()` is called after login; it pulls the entire dataset once.
//   * Explicit mutation helpers (createClient/updateVideo/...) push to server
//     and update the local arrays in place.
//   * `persist()` still exists (many pages call it after inline mutations) and
//     performs a full reconciliation: for each entity, upsert everything that
//     was modified locally and delete anything that disappeared locally.
//   * A tiny subscribe/notify mechanism lets pages `useStoreVersion()` to
//     force a re-render whenever the cache changes.

import axios from 'axios';

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const TOKEN_KEY = 'editvault_token_v1';
export const setToken = (t) => { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); };
export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const http = axios.create({ baseURL: API });
http.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${t}` };
  return cfg;
});

// ---------------------------------------------------------------------------
// Constants + reactive plumbing
// ---------------------------------------------------------------------------
export const MONTH_LABEL = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const DEFAULT_CATEGORIES = [
  'Long Video', 'Short Video / Reel', 'Advertisement', 'YouTube Video', 'YouTube Short',
  'Instagram Reel', 'Facebook Reel', 'TikTok Video', 'Intro', 'Outro', 'Trailer / Teaser',
  'Poster', 'Thumbnail', 'Motion Graphics', 'VFX Shot', 'Color Grading', 'Podcast Audio Edit',
];

const subs = new Set();
let _version = 0;
export const bumpVersion = () => { _version += 1; subs.forEach((fn) => { try { fn(_version); } catch (_) {} }); };
export const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
export const getVersion = () => _version;

// ---------------------------------------------------------------------------
// Cached data — kept as mutable references so page code that reads them
// (e.g. `clients.find(...)`) keeps working after `initStore()`.
// ---------------------------------------------------------------------------
export const clients    = [];
export const videos     = [];
export const expenses   = [];
export const bills      = [];
export const admins     = [];
export const activityLog = [];
export const categories = [...DEFAULT_CATEGORIES];
export const settings   = { company: { name: '', address: '', gstin: '', phone: '', email: '', website: '', logo_url: '', invoice_prefix: 'EV', next_invoice_number: 1001 } };

// Snapshot of last-known-server IDs per collection (for delete reconciliation).
const known = { clients: new Set(), videos: new Set(), expenses: new Set(), bills: new Set(), admins: new Set() };

const replaceArr = (arr, next) => { arr.splice(0, arr.length, ...next); };

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`;

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
let _initedFor = null;
export async function initStore(profile) {
  // Fetch everything the current role can see.
  const isAdmin = profile?.role === 'admin';
  const [cs, vs, es, bs, cats, comp] = await Promise.all([
    http.get('/clients').then((r) => r.data),
    http.get('/videos').then((r) => r.data),
    http.get('/expenses').then((r) => r.data),
    http.get('/bills').then((r) => r.data),
    http.get('/categories').then((r) => r.data).catch(() => DEFAULT_CATEGORIES),
    http.get('/settings/company').then((r) => r.data).catch(() => ({})),
  ]);
  replaceArr(clients, cs || []);
  replaceArr(videos, vs || []);
  replaceArr(expenses, es || []);
  replaceArr(bills, bs || []);
  replaceArr(categories, (cats && cats.length ? cats : DEFAULT_CATEGORIES));
  settings.company = { ...settings.company, ...(comp || {}) };

  if (isAdmin) {
    const [ads, act] = await Promise.all([
      http.get('/admins').then((r) => r.data).catch(() => []),
      http.get('/activity?limit=20').then((r) => r.data).catch(() => []),
    ]);
    replaceArr(admins, ads || []);
    replaceArr(activityLog, act || []);
  } else {
    replaceArr(admins, []);
    replaceArr(activityLog, []);
  }

  known.clients  = new Set(clients.map((x) => x.id));
  known.videos   = new Set(videos.map((x) => x.id));
  known.expenses = new Set(expenses.map((x) => x.id));
  known.bills    = new Set(bills.map((x) => x.id));
  known.admins   = new Set(admins.map((x) => x.id));

  _initedFor = profile?.username || null;
  bumpVersion();
}

export function clearStore() {
  replaceArr(clients, []); replaceArr(videos, []); replaceArr(expenses, []);
  replaceArr(bills, []); replaceArr(admins, []); replaceArr(activityLog, []);
  replaceArr(categories, [...DEFAULT_CATEGORIES]);
  settings.company = { name: '', address: '', gstin: '', phone: '', email: '', website: '', logo_url: '', invoice_prefix: 'EV', next_invoice_number: 1001 };
  Object.keys(known).forEach((k) => known[k].clear());
  _initedFor = null;
  bumpVersion();
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------
export const getClientById       = (id) => clients.find((c) => c.id === id);
export const getVideosByClient   = (id) => videos.filter((v) => v.client_id === id);
export const getExpensesByClient = (id) => expenses.filter((e) => e.client_id === id);
export const getBillsByClient    = (id) => bills.filter((b) => b.client_id === id);

export const availableYears = () => {
  const ys = new Set(videos.map((v) => v.year).concat(expenses.map((e) => e.year)).concat(bills.map((b) => b.year)));
  ys.add(new Date().getFullYear());
  return [...ys].filter((n) => Number.isFinite(n)).sort((a, b) => b - a);
};

export const snapshotFor = ({ clientId, year, month }) => {
  const inMonth = (y, m) => (month === 0 ? y === year : y === year && m === month);
  const client = clients.find((c) => c.id === clientId) || null;
  return {
    generated_at: new Date().toISOString(),
    company: settings.company,
    filter: { client_id: clientId, year, month },
    client,
    videos:   videos.filter((v) => v.client_id === clientId && inMonth(v.year, v.month)),
    expenses: expenses.filter((e) => e.client_id === clientId && inMonth(e.year, e.month)),
    bills:    bills.filter((b) => b.client_id === clientId && inMonth(b.year, b.month)),
  };
};

// ---------------------------------------------------------------------------
// Mutations — clients
// ---------------------------------------------------------------------------
export async function apiCreateClient(payload) {
  const res = await http.post('/clients', payload);
  const doc = res.data;
  clients.push(doc);
  known.clients.add(doc.id);
  bumpVersion();
  return doc;
}
export async function apiUpdateClient(id, patch) {
  const res = await http.put(`/clients/${id}`, patch);
  const doc = res.data;
  const i = clients.findIndex((c) => c.id === id);
  if (i >= 0) clients[i] = doc; else clients.push(doc);
  bumpVersion();
  return doc;
}
export async function apiDeleteClient(id) {
  await http.delete(`/clients/${id}`);
  const i = clients.findIndex((c) => c.id === id);
  if (i >= 0) clients.splice(i, 1);
  for (let k = videos.length - 1; k >= 0; k--) if (videos[k].client_id === id) videos.splice(k, 1);
  known.clients.delete(id);
  bumpVersion();
}
export async function apiMoveClient(id, dir) {
  await http.post(`/clients/${id}/move?direction=${dir}`);
  // Re-fetch to reflect canonical order.
  const cs = (await http.get('/clients')).data;
  replaceArr(clients, cs);
  known.clients = new Set(clients.map((x) => x.id));
  bumpVersion();
}

// ---------------------------------------------------------------------------
// Mutations — videos
// ---------------------------------------------------------------------------
export async function apiCreateVideo(payload) {
  const res = await http.post('/videos', payload);
  const doc = res.data;
  videos.push(doc);
  known.videos.add(doc.id);
  bumpVersion();
  return doc;
}
export async function apiUpdateVideo(id, patch) {
  const res = await http.put(`/videos/${id}`, patch);
  const doc = res.data;
  const i = videos.findIndex((v) => v.id === id);
  if (i >= 0) videos[i] = doc; else videos.push(doc);
  bumpVersion();
  return doc;
}
export async function apiDeleteVideo(id) {
  await http.delete(`/videos/${id}`);
  const i = videos.findIndex((v) => v.id === id);
  if (i >= 0) videos.splice(i, 1);
  known.videos.delete(id);
  bumpVersion();
}
export async function apiAddCorrectionNote(videoId, note, from) {
  const res = await http.post(`/videos/${videoId}/corrections`, { note, from });
  const v = videos.find((x) => x.id === videoId);
  if (v) { v.corrections = v.corrections || []; v.corrections.push(res.data); }
  bumpVersion();
  return res.data;
}

// ---------------------------------------------------------------------------
// Mutations — expenses
// ---------------------------------------------------------------------------
export async function apiCreateExpense(payload) {
  const res = await http.post('/expenses', payload);
  const doc = res.data;
  expenses.push(doc);
  known.expenses.add(doc.id);
  bumpVersion();
  return doc;
}
export async function apiUpdateExpense(id, patch) {
  const res = await http.put(`/expenses/${id}`, patch);
  const doc = res.data;
  const i = expenses.findIndex((e) => e.id === id);
  if (i >= 0) expenses[i] = doc; else expenses.push(doc);
  bumpVersion();
  return doc;
}
export async function apiDeleteExpense(id) {
  await http.delete(`/expenses/${id}`);
  const i = expenses.findIndex((e) => e.id === id);
  if (i >= 0) expenses.splice(i, 1);
  known.expenses.delete(id);
  bumpVersion();
}

// ---------------------------------------------------------------------------
// Mutations — bills
// ---------------------------------------------------------------------------
export async function apiUpsertBill(payload) {
  const res = await http.post('/bills', payload);
  const doc = res.data;
  const i = bills.findIndex((b) => b.id === doc.id);
  if (i >= 0) bills[i] = doc; else bills.push(doc);
  known.bills.add(doc.id);
  bumpVersion();
  return doc;
}
export async function apiUpdateBill(id, patch) {
  const res = await http.put(`/bills/${id}`, patch);
  const doc = res.data;
  const i = bills.findIndex((b) => b.id === id);
  if (i >= 0) bills[i] = doc;
  bumpVersion();
  return doc;
}
export async function apiDeleteBill(id) {
  await http.delete(`/bills/${id}`);
  const i = bills.findIndex((b) => b.id === id);
  if (i >= 0) bills.splice(i, 1);
  known.bills.delete(id);
  bumpVersion();
}

// ---------------------------------------------------------------------------
// Mutations — admins & settings
// ---------------------------------------------------------------------------
export async function apiCreateAdmin(payload) {
  const res = await http.post('/admins', payload);
  admins.push(res.data);
  known.admins.add(res.data.id);
  bumpVersion();
  return res.data;
}
export async function apiUpdateAdmin(id, patch) {
  const res = await http.put(`/admins/${id}`, patch);
  const i = admins.findIndex((a) => a.id === id);
  if (i >= 0) admins[i] = res.data;
  bumpVersion();
  return res.data;
}
export async function apiDeleteAdmin(id) {
  await http.delete(`/admins/${id}`);
  const i = admins.findIndex((a) => a.id === id);
  if (i >= 0) admins.splice(i, 1);
  known.admins.delete(id);
  bumpVersion();
}
export async function apiUpdateSettings(patch) {
  const res = await http.put('/settings/company', patch);
  settings.company = { ...settings.company, ...(res.data || {}) };
  bumpVersion();
  return settings.company;
}
export async function apiAddCategory(name) {
  const res = await http.post('/categories', { name });
  replaceArr(categories, res.data || categories);
  bumpVersion();
  return categories;
}

// ---------------------------------------------------------------------------
// nextInvoiceNo -- server assigns it when POSTing bills; kept as a stub for
// legacy call-sites that used the client-side counter.
// ---------------------------------------------------------------------------
export const nextInvoiceNo = () => {
  const s = settings.company;
  return `${s.invoice_prefix || 'EV'}-${s.next_invoice_number || 1001}`;
};

// ---------------------------------------------------------------------------
// persist() — reconciliation sync used by legacy inline-mutation call-sites.
// It walks every collection, PUTs anything the server knows about, POSTs any
// items whose ID isn't recognised, and DELETEs any items that disappeared
// locally since the last sync. Best-effort; runs in the background.
// ---------------------------------------------------------------------------
let _pending = null;
export function persist() {
  if (_pending) return _pending;
  _pending = new Promise(async (resolve) => {
    try { await _reconcile(); } catch (_) {}
    _pending = null;
    bumpVersion();
    resolve();
  });
  return _pending;
}

async function _reconcile() {
  const jobs = [];
  const push = (p) => jobs.push(p.catch(() => null));

  // Clients: update existing, POST new local records (with password/id remap), delete missing
  const currentClientIds = new Set(clients.map((c) => c.id));
  for (const c of clients) {
    if (known.clients.has(c.id)) push(http.put(`/clients/${c.id}`, _clientPatch(c)));
    else if (c.password) push(http.post('/clients', { name: c.name, username: c.username, password: c.password, phone: c.phone, email: c.email, monthlyFee: c.monthlyFee, active: c.active, logo_url: c.logo_url }).then((r) => { const old = c.id; c.id = r.data.id; known.clients.add(c.id); currentClientIds.delete(old); currentClientIds.add(c.id); }));
  }
  for (const id of known.clients) if (!currentClientIds.has(id)) push(http.delete(`/clients/${id}`));

  // Videos
  const currentVideoIds = new Set(videos.map((v) => v.id));
  for (const v of videos) {
    if (known.videos.has(v.id)) push(http.put(`/videos/${v.id}`, _videoPatch(v)));
    else push(http.post('/videos', _videoCreate(v)).then((r) => { const old = v.id; v.id = r.data.id; known.videos.add(v.id); currentVideoIds.delete(old); currentVideoIds.add(v.id); }));
  }
  for (const id of known.videos) if (!currentVideoIds.has(id)) push(http.delete(`/videos/${id}`));

  // Expenses
  const currentExpIds = new Set(expenses.map((e) => e.id));
  for (const e of expenses) {
    if (known.expenses.has(e.id)) push(http.put(`/expenses/${e.id}`, _expensePatch(e)));
    else push(http.post('/expenses', _expenseCreate(e)).then((r) => { const old = e.id; e.id = r.data.id; known.expenses.add(e.id); currentExpIds.delete(old); currentExpIds.add(e.id); }));
  }
  for (const id of known.expenses) if (!currentExpIds.has(id)) push(http.delete(`/expenses/${id}`));

  // Bills
  const currentBillIds = new Set(bills.map((b) => b.id));
  for (const b of bills) {
    if (known.bills.has(b.id)) push(http.put(`/bills/${b.id}`, _billPatch(b)));
    else push(http.post('/bills', _billCreate(b)).then((r) => { const old = b.id; b.id = r.data.id; b.invoice_no = r.data.invoice_no; known.bills.add(b.id); currentBillIds.delete(old); currentBillIds.add(b.id); }));
  }
  for (const id of known.bills) if (!currentBillIds.has(id)) push(http.delete(`/bills/${id}`));

  // Admins
  const currentAdminIds = new Set(admins.map((a) => a.id));
  for (const a of admins) {
    if (known.admins.has(a.id)) push(http.put(`/admins/${a.id}`, _adminPatch(a)));
    else if (a.password) push(http.post('/admins', { username: a.username, password: a.password, full_name: a.full_name }).then((r) => { const old = a.id; a.id = r.data.id; known.admins.add(a.id); currentAdminIds.delete(old); currentAdminIds.add(a.id); }));
  }
  for (const id of known.admins) if (!currentAdminIds.has(id)) push(http.delete(`/admins/${id}`));

  // Company settings
  push(http.put('/settings/company', settings.company));

  await Promise.all(jobs);

  known.clients  = currentClientIds;
  known.videos   = currentVideoIds;
  known.expenses = currentExpIds;
  known.bills    = currentBillIds;
  known.admins   = currentAdminIds;
}

const _videoCreate  = (v) => ({ client_id: v.client_id, name: v.name, duration: v.duration, category: v.category, version: v.version, editor_status: v.editor_status, client_status: v.client_status, posted_date: v.posted_date, amount: v.amount, year: v.year, month: v.month, due_date: v.due_date, client_locked: !!v.client_locked, file_url: v.file_url, file_name: v.file_name });
const _expenseCreate= (e) => ({ client_id: e.client_id, date: e.date, description: e.description, amount: e.amount, status: e.status, year: e.year, month: e.month });
const _billCreate   = (b) => ({ client_id: b.client_id, year: b.year, month: b.month, subtotal: b.subtotal || 0, discount: b.discount || 0, tax: b.tax || 0, total_amount: b.total_amount, status: b.status || 'Pending' });

// Whitelisted fields for reconciliation PUTs — strip server-managed keys.
const pick = (obj, keys) => keys.reduce((a, k) => { if (obj[k] !== undefined) a[k] = obj[k]; return a; }, {});
const _clientPatch  = (c) => pick(c, ['name','phone','email','monthlyFee','active','logo_url']);
const _videoPatch   = (v) => pick(v, ['name','duration','category','version','editor_status','client_status','posted_date','amount','year','month','due_date','client_locked','file_url','file_name','corrections']);
const _expensePatch = (e) => pick(e, ['date','description','amount','status','year','month']);
const _billPatch    = (b) => pick(b, ['subtotal','discount','tax','total_amount','status']);
const _adminPatch   = (a) => pick(a, ['full_name']);

// ---------------------------------------------------------------------------
// Legacy resolveUser() no longer applies — login is server-side.
// Kept as a stub so any lingering import doesn't crash.
// ---------------------------------------------------------------------------
export const resolveUser = () => null;

// React hook — page components subscribe to store changes to re-render.
import { useEffect, useState } from 'react';
export function useStoreVersion() {
  const [v, setV] = useState(getVersion());
  useEffect(() => subscribe((n) => setV(n)), []);
  return v;
}

// Also-common helper – the default month/year for filters that pages use.
export const currentPeriod = () => {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
};
