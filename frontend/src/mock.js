// Mock data for EditVault CRM (extended with settings, file metadata, admin users)

export const MONTH_LABEL = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const DEFAULT_CATEGORIES = [
  'Long Video', 'Short Video / Reel', 'Advertisement', 'YouTube Video', 'YouTube Short',
  'Instagram Reel', 'Facebook Reel', 'TikTok Video', 'Intro', 'Outro', 'Trailer / Teaser',
  'Poster', 'Thumbnail', 'Motion Graphics', 'VFX Shot', 'Color Grading', 'Podcast Audio Edit',
];

const LS_KEY = 'editvault_store_v3';

const seed = {
  categories: [...DEFAULT_CATEGORIES],
  settings: {
    company: {
      name: 'EditVault Studio',
      address: '221B, Baker Street, Bengaluru 560001',
      gstin: '29ABCDE1234F1Z5',
      phone: '+91 98765 43210',
      email: 'billing@editvault.studio',
      website: 'editvault.studio',
      logo_url: '',
      invoice_prefix: 'EV',
      next_invoice_number: 1001,
    },
  },
  admins: [
    { id: 'u1', username: 'admin', password: 'admin123', full_name: 'Robin (Admin)', role: 'admin' },
  ],
  clients: [
    { id: 'c1', name: 'ABC Fitness',  username: 'abcfitness',  password: 'client123', phone: '+91 98765 43210', email: 'contact@abcfitness.com', monthlyFee: 18000, active: true, logo_url: '' },
    { id: 'c2', name: 'XYZ Builders', username: 'xyzbuilders', password: 'client123', phone: '+91 87654 32109', email: 'info@xyzbuilders.com',   monthlyFee: 12500, active: true, logo_url: '' },
    { id: 'c3', name: 'Green Cafe',   username: 'greencafe',   password: 'client123', phone: '+91 76543 21098', email: 'hello@greencafe.com',    monthlyFee:  8000, active: true, logo_url: '' },
    { id: 'c4', name: 'Urban Styles', username: 'urbanstyles', password: 'client123', phone: '+91 65432 10987', email: 'team@urbanstyles.com',   monthlyFee: 15000, active: true, logo_url: '' },
    { id: 'c5', name: 'TechNova',     username: 'technova',    password: 'client123', phone: '+91 54321 09876', email: 'support@technova.in',    monthlyFee: 20000, active: true, logo_url: '' },
  ],
  videos: [
    // file_url + file_name are populated after admin uploads via /api/uploads.
    { id: 'v1', client_id: 'c1', name: 'Gym Reel 01',    duration: '00:45', category: 'Instagram Reel', version: 'V3', editor_status: 'Done',           client_status: 'Approved', posted_date: '2026-06-15', amount:  600, year: 2026, month: 6, due_date: 'June 2026', client_locked: true,  file_url: null, file_name: 'Gym_Reel_01_v3.mp4' },
    { id: 'v2', client_id: 'c1', name: 'Gym Reel 02',    duration: '00:30', category: 'Instagram Reel', version: 'V2', editor_status: 'Done',           client_status: 'Approved', posted_date: null,         amount:  600, year: 2026, month: 6, due_date: 'June 2026', client_locked: true,  file_url: null, file_name: 'Gym_Reel_02_v2.mp4' },
    { id: 'v3', client_id: 'c1', name: 'Promo Video',    duration: '01:20', category: 'Advertisement',  version: 'V1', editor_status: 'In Progress',    client_status: null,       posted_date: null,         amount: 1500, year: 2026, month: 6, due_date: 'June 2026', client_locked: false, file_url: null, file_name: null },
    { id: 'v4', client_id: 'c1', name: 'Trainer Intro',  duration: '02:10', category: 'Intro',          version: 'V4', editor_status: 'Done',           client_status: 'Approved', posted_date: '2026-06-10', amount: 2000, year: 2026, month: 6, due_date: 'June 2026', client_locked: true,  file_url: null, file_name: 'Trainer_Intro_v4.mp4' },
    { id: 'v5', client_id: 'c2', name: 'Site Tour Reel', duration: '00:50', category: 'Instagram Reel', version: 'V2', editor_status: 'Sent To Client', client_status: 'Correction', posted_date: null,       amount:  700, year: 2026, month: 6, due_date: 'June 2026', client_locked: false, file_url: null, file_name: 'Site_Tour_Reel_v2.mp4', corrections: [{ id: 'cn1', at: '2026-06-14T10:12:00', from: 'client', note: 'Please trim the intro to 3 seconds and use the second logo variant. Also match the audio levels on the outro.' }] },
    { id: 'v6', client_id: 'c2', name: 'Project Showcase', duration: '02:30', category: 'YouTube Video', version: 'V1', editor_status: 'In Progress',   client_status: null,       posted_date: null,         amount:  800, year: 2026, month: 6, due_date: 'June 2026', client_locked: false, file_url: null, file_name: null },
    { id: 'v7', client_id: 'c3', name: 'Coffee Reel 01', duration: '00:25', category: 'Instagram Reel', version: 'V1', editor_status: 'Not Started',    client_status: null,       posted_date: null,         amount:  500, year: 2026, month: 6, due_date: 'June 2026', client_locked: false, file_url: null, file_name: null },
    { id: 'v8', client_id: 'c3', name: 'Cafe Vibes',     duration: '00:40', category: 'Short Video / Reel', version: 'V2', editor_status: 'Done',       client_status: 'Approved', posted_date: '2026-06-08', amount:  500, year: 2026, month: 6, due_date: 'June 2026', client_locked: true,  file_url: null, file_name: 'Cafe_Vibes_v2.mp4' },
    { id: 'v9', client_id: 'c4', name: 'Lookbook Reel',  duration: '00:35', category: 'Instagram Reel', version: 'V3', editor_status: 'Sent To Client', client_status: 'Rejected',  posted_date: null,         amount:  750, year: 2026, month: 6, due_date: 'June 2026', client_locked: false, file_url: null, file_name: 'Lookbook_Reel_v3.mp4' },
    { id: 'v10',client_id: 'c4', name: 'Brand Story',    duration: '01:50', category: 'Advertisement',  version: 'V2', editor_status: 'Done',           client_status: 'Approved', posted_date: '2026-06-22', amount: 1200, year: 2026, month: 6, due_date: 'June 2026', client_locked: true,  file_url: null, file_name: 'Brand_Story_v2.mp4' },
    { id: 'v11',client_id: 'c5', name: 'Product Launch', duration: '03:00', category: 'YouTube Video',  version: 'V1', editor_status: 'In Progress',    client_status: null,       posted_date: null,         amount: 2500, year: 2026, month: 6, due_date: 'June 2026', client_locked: false, file_url: null, file_name: null },
    { id: 'v12',client_id: 'c1', name: 'May Promo',      duration: '00:50', category: 'Advertisement',  version: 'V1', editor_status: 'Done',           client_status: 'Approved', posted_date: '2026-05-18', amount: 1500, year: 2026, month: 5, due_date: 'May 2026',  client_locked: true,  file_url: null, file_name: 'May_Promo_v1.mp4' },
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
    { id: 'b1', client_id: 'c1', year: 2026, month: 6, total_amount: 3100, subtotal: 3100, discount: 0, tax: 0, status: 'Pending', generated_at: '2026-06-25', invoice_no: 'EV-1001' },
    { id: 'b2', client_id: 'c3', year: 2026, month: 6, total_amount:  500, subtotal:  500, discount: 0, tax: 0, status: 'Paid',    generated_at: '2026-06-25', invoice_no: 'EV-1002' },
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
    if (raw) {
      const parsed = JSON.parse(raw);
      // shallow-merge any newly seeded top-level keys so upgrades don't wipe existing data
      Object.keys(seed).forEach((k) => { if (parsed[k] === undefined) parsed[k] = JSON.parse(JSON.stringify(seed[k])); });
      return parsed;
    }
  } catch (_) {}
  return JSON.parse(JSON.stringify(seed));
}
function saveStore(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (_) {}
}

let store = loadStore();

export const clients    = store.clients;
export const videos     = store.videos;
export const expenses   = store.expenses;
export const bills      = store.bills;
export const activityLog= store.activityLog;
export const categories = store.categories;
export const admins     = store.admins;
export const settings   = store.settings;

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

export const nextInvoiceNo = () => {
  const s = store.settings.company;
  const n = s.next_invoice_number || 1001;
  s.next_invoice_number = n + 1;
  persist();
  return `${s.invoice_prefix || 'EV'}-${n}`;
};

// Export a snapshot for backups / invoices
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
