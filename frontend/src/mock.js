// Mock data for EditVault CRM (frontend-only, extended)

export const MONTH_LABEL = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const DEFAULT_CATEGORIES = [
  'Long Video', 'Short Video / Reel', 'Advertisement', 'YouTube Video', 'YouTube Short',
  'Instagram Reel', 'Facebook Reel', 'TikTok Video', 'Intro', 'Outro', 'Trailer / Teaser',
  'Poster', 'Thumbnail', 'Motion Graphics', 'VFX Shot', 'Color Grading', 'Podcast Audio Edit',
];

// Simple in-memory store; also persisted to localStorage so state survives navigation.
const LS_KEY = 'editvault_store_v2';

const seed = {
  categories: [...DEFAULT_CATEGORIES],
  clients: [
    { id: 'c1', name: 'ABC Fitness',  username: 'abcfitness',  password: 'client123', phone: '+91 98765 43210', email: 'contact@abcfitness.com', monthlyFee: 18000, active: true },
    { id: 'c2', name: 'XYZ Builders', username: 'xyzbuilders', password: 'client123', phone: '+91 87654 32109', email: 'info@xyzbuilders.com',   monthlyFee: 12500, active: true },
    { id: 'c3', name: 'Green Cafe',   username: 'greencafe',   password: 'client123', phone: '+91 76543 21098', email: 'hello@greencafe.com',    monthlyFee:  8000, active: true },
    { id: 'c4', name: 'Urban Styles', username: 'urbanstyles', password: 'client123', phone: '+91 65432 10987', email: 'team@urbanstyles.com',   monthlyFee: 15000, active: true },
    { id: 'c5', name: 'TechNova',     username: 'technova',    password: 'client123', phone: '+91 54321 09876', email: 'support@technova.in',    monthlyFee: 20000, active: true },
  ],
  videos: [
    { id: 'v1', client_id: 'c1', name: 'Gym Reel 01',    duration: '00:45', category: 'Instagram Reel', version: 'V3', editor_status: 'Done',           client_status: 'Approved', posted_date: '2026-06-15', amount:  600, year: 2026, month: 6, due_date: 'June 2026', client_locked: true  },
    { id: 'v2', client_id: 'c1', name: 'Gym Reel 02',    duration: '00:30', category: 'Instagram Reel', version: 'V2', editor_status: 'Done',           client_status: 'Approved', posted_date: null,         amount:  600, year: 2026, month: 6, due_date: 'June 2026', client_locked: true  },
    { id: 'v3', client_id: 'c1', name: 'Promo Video',    duration: '01:20', category: 'Advertisement',  version: 'V1', editor_status: 'In Progress',    client_status: null,       posted_date: null,         amount: 1500, year: 2026, month: 6, due_date: 'June 2026', client_locked: false },
    { id: 'v4', client_id: 'c1', name: 'Trainer Intro',  duration: '02:10', category: 'Intro',          version: 'V4', editor_status: 'Done',           client_status: 'Approved', posted_date: '2026-06-10', amount: 2000, year: 2026, month: 6, due_date: 'June 2026', client_locked: true  },
    { id: 'v5', client_id: 'c2', name: 'Site Tour Reel', duration: '00:50', category: 'Instagram Reel', version: 'V2', editor_status: 'Sent To Client', client_status: 'Correction', posted_date: null,       amount:  700, year: 2026, month: 6, due_date: 'June 2026', client_locked: false },
    { id: 'v6', client_id: 'c2', name: 'Project Showcase', duration: '02:30', category: 'YouTube Video', version: 'V1', editor_status: 'In Progress',   client_status: null,       posted_date: null,         amount:  800, year: 2026, month: 6, due_date: 'June 2026', client_locked: false },
    { id: 'v7', client_id: 'c3', name: 'Coffee Reel 01', duration: '00:25', category: 'Instagram Reel', version: 'V1', editor_status: 'Not Started',    client_status: null,       posted_date: null,         amount:  500, year: 2026, month: 6, due_date: 'June 2026', client_locked: false },
    { id: 'v8', client_id: 'c3', name: 'Cafe Vibes',     duration: '00:40', category: 'Short Video / Reel', version: 'V2', editor_status: 'Done',       client_status: 'Approved', posted_date: '2026-06-08', amount:  500, year: 2026, month: 6, due_date: 'June 2026', client_locked: true  },
    { id: 'v9', client_id: 'c4', name: 'Lookbook Reel',  duration: '00:35', category: 'Instagram Reel', version: 'V3', editor_status: 'Sent To Client', client_status: 'Rejected',  posted_date: null,         amount:  750, year: 2026, month: 6, due_date: 'June 2026', client_locked: false },
    { id: 'v10',client_id: 'c4', name: 'Brand Story',    duration: '01:50', category: 'Advertisement',  version: 'V2', editor_status: 'Done',           client_status: 'Approved', posted_date: '2026-06-22', amount: 1200, year: 2026, month: 6, due_date: 'June 2026', client_locked: true  },
    { id: 'v11',client_id: 'c5', name: 'Product Launch', duration: '03:00', category: 'YouTube Video',  version: 'V1', editor_status: 'In Progress',    client_status: null,       posted_date: null,         amount: 2500, year: 2026, month: 6, due_date: 'June 2026', client_locked: false },
    { id: 'v12',client_id: 'c1', name: 'May Promo',      duration: '00:50', category: 'Advertisement',  version: 'V1', editor_status: 'Done',           client_status: 'Approved', posted_date: '2026-05-18', amount: 1500, year: 2026, month: 5, due_date: 'May 2026',  client_locked: true  },
  ],
  expenses: [
    { id: 'e1', client_id: 'c1', date: '2026-06-05', description: 'Video Editing \u2014 Gym Reel 01', amount:  600, status: 'Paid',   year: 2026, month: 6 },
    { id: 'e2', client_id: 'c1', date: '2026-06-12', description: 'Thumbnail design',                amount:  500, status: 'Unpaid', year: 2026, month: 6 },
    { id: 'e3', client_id: 'c1', date: '2026-06-20', description: 'Trainer Intro Edit',              amount: 2000, status: 'Unpaid', year: 2026, month: 6 },
    { id: 'e4', client_id: 'c2', date: '2026-06-14', description: 'Site Tour Reel Edit',             amount:  700, status: 'Unpaid', year: 2026, month: 6 },
    { id: 'e5', client_id: 'c3', date: '2026-06-08', description: 'Cafe Vibes Reel',                 amount:  500, status: 'Paid',   year: 2026, month: 6 },
    { id: 'e6', client_id: 'c4', date: '2026-06-22', description: 'Brand Story Edit',                amount: 1200, status: 'Paid',   year: 2026, month: 6 },
  ],
  bills: [
    { id: 'b1', client_id: 'c1', year: 2026, month: 6, total_amount: 3100, status: 'Pending', generated_at: '2026-06-25', invoice_url: '#' },
    { id: 'b2', client_id: 'c3', year: 2026, month: 6, total_amount:  500, status: 'Paid',    generated_at: '2026-06-25', invoice_url: '#' },
  ],
  activityLog: [
    { id: 'a1', at: '2026-06-22T09:12:00', actor: 'Editor', action: 'marked Done',           target: 'Brand Story',    client: 'Urban Styles'  },
    { id: 'a2', at: '2026-06-22T08:40:00', actor: 'Client', action: 'Approved',              target: 'Gym Reel 02',    client: 'ABC Fitness'   },
    { id: 'a3', at: '2026-06-21T18:03:00', actor: 'Client', action: 'Requested Correction',  target: 'Site Tour Reel', client: 'XYZ Builders' },
    { id: 'a4', at: '2026-06-21T14:22:00', actor: 'Editor', action: 'Sent To Client',        target: 'Lookbook Reel',  client: 'Urban Styles'  },
    { id: 'a5', at: '2026-06-20T11:05:00', actor: 'Editor', action: 'Started',               target: 'Product Launch', client: 'TechNova'      },
  ],
};

function loadStore() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return JSON.parse(JSON.stringify(seed));
}
function saveStore(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (_) {}
}

let store = loadStore();

// Live-updating references (arrays are the same objects the app mutates).
export const clients    = store.clients;
export const videos     = store.videos;
export const expenses   = store.expenses;
export const bills      = store.bills;
export const activityLog= store.activityLog;
export const categories = store.categories;

// Persist helper (call after mutations)
export const persist = () => saveStore(store);

// Reset helper (dev)
export const resetStore = () => { store = JSON.parse(JSON.stringify(seed)); saveStore(store); window.location.reload(); };

// Auth users: admins + one client user per client row (dynamically resolved).
export const adminUsers = [
  { username: 'admin', password: 'admin123', role: 'admin', full_name: 'Robin (Admin)' },
];

export const resolveUser = (username, password) => {
  const u = (username || '').trim().toLowerCase();
  const admin = adminUsers.find((a) => a.username === u && a.password === password);
  if (admin) return { username: admin.username, role: 'admin', full_name: admin.full_name };
  const c = clients.find((x) => x.username.toLowerCase() === u && x.password === password);
  if (c) return { username: c.username, role: 'client', client_id: c.id, full_name: c.name };
  return null;
};

export const getClientById  = (id) => clients.find((c) => c.id === id);
export const getVideosByClient = (id) => videos.filter((v) => v.client_id === id);
export const getExpensesByClient = (id) => expenses.filter((e) => e.client_id === id);
export const getBillsByClient = (id) => bills.filter((b) => b.client_id === id);

export const availableYears = () => {
  const ys = new Set(videos.map((v) => v.year).concat(expenses.map((e) => e.year)));
  ys.add(new Date().getFullYear());
  return [...ys].sort((a, b) => b - a);
};

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`;
