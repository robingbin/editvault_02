// EditVault data store — production-ready seed (no demo data).
// Everything is still persisted client-side to localStorage until a real backend
// is wired up. The admin user is bootstrapped so the app is usable on first run.

export const MONTH_LABEL = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const DEFAULT_CATEGORIES = [
  'Long Video', 'Short Video / Reel', 'Advertisement', 'YouTube Video', 'YouTube Short',
  'Instagram Reel', 'Facebook Reel', 'TikTok Video', 'Intro', 'Outro', 'Trailer / Teaser',
  'Poster', 'Thumbnail', 'Motion Graphics', 'VFX Shot', 'Color Grading', 'Podcast Audio Edit',
];

const LS_KEY = 'editvault_store_v4';

const emptySeed = {
  categories: [...DEFAULT_CATEGORIES],
  settings: {
    company: {
      name: '',
      address: '',
      gstin: '',
      phone: '',
      email: '',
      website: '',
      logo_url: '',
      invoice_prefix: 'EV',
      next_invoice_number: 1001,
    },
  },
  admins: [
    { id: 'u1', username: 'admin', password: 'admin123', full_name: 'Administrator', role: 'admin' },
  ],
  clients: [],
  videos: [],
  expenses: [],
  bills: [],
  activityLog: [],
};

function loadStore() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.keys(emptySeed).forEach((k) => {
        if (parsed[k] === undefined) parsed[k] = JSON.parse(JSON.stringify(emptySeed[k]));
      });
      return parsed;
    }
  } catch (_) {}
  return JSON.parse(JSON.stringify(emptySeed));
}
function saveStore(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (_) {}
}

let store = loadStore();

// Live-updating references so the app can mutate arrays in-place.
export const clients     = store.clients;
export const videos      = store.videos;
export const expenses    = store.expenses;
export const bills       = store.bills;
export const activityLog = store.activityLog;
export const categories  = store.categories;
export const admins      = store.admins;
export const settings    = store.settings;

export const persist = () => saveStore(store);
export const resetStore = () => { localStorage.removeItem(LS_KEY); window.location.reload(); };

export const resolveUser = (username, password) => {
  const u = (username || '').trim().toLowerCase();
  const admin = admins.find((a) => a.username.toLowerCase() === u && a.password === password);
  if (admin) return { username: admin.username, role: 'admin', full_name: admin.full_name };
  const c = clients.find((x) => x.username.toLowerCase() === u && x.password === password);
  if (c) return { username: c.username, role: 'client', client_id: c.id, full_name: c.name };
  return null;
};

export const getClientById       = (id) => clients.find((c) => c.id === id);
export const getVideosByClient   = (id) => videos.filter((v) => v.client_id === id);
export const getExpensesByClient = (id) => expenses.filter((e) => e.client_id === id);
export const getBillsByClient    = (id) => bills.filter((b) => b.client_id === id);

export const availableYears = () => {
  const ys = new Set(videos.map((v) => v.year).concat(expenses.map((e) => e.year)));
  ys.add(new Date().getFullYear());
  return [...ys].sort((a, b) => b - a);
};

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`;

export const nextInvoiceNo = () => {
  const s = store.settings.company;
  const n = s.next_invoice_number || 1001;
  s.next_invoice_number = n + 1;
  persist();
  return `${s.invoice_prefix || 'EV'}-${n}`;
};

export const snapshotFor = ({ clientId, year, month }) => {
  const inMonth = (y, m) => (month === 0 ? y === year : y === year && m === month);
  const client = clients.find((c) => c.id === clientId) || null;
  return {
    generated_at: new Date().toISOString(),
    company: store.settings.company,
    filter: { client_id: clientId, year, month },
    client,
    videos:   videos.filter((v) => v.client_id === clientId && inMonth(v.year, v.month)),
    expenses: expenses.filter((e) => e.client_id === clientId && inMonth(e.year, e.month)),
    bills:    bills.filter((b) => b.client_id === clientId && inMonth(b.year, b.month)),
  };
};
