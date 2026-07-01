// Mock data for EditVault CRM (frontend-only)

export const MONTH_LABEL = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const clients = [
  { id: 'c1', name: 'ABC Fitness',   username: 'abcfitness',   phone: '+91 98765 43210', email: 'contact@abcfitness.com',  monthlyFee: 18000, active: true },
  { id: 'c2', name: 'XYZ Builders',  username: 'xyzbuilders',  phone: '+91 87654 32109', email: 'info@xyzbuilders.com',   monthlyFee: 12500, active: true },
  { id: 'c3', name: 'Green Cafe',    username: 'greencafe',    phone: '+91 76543 21098', email: 'hello@greencafe.com',    monthlyFee:  8000, active: true },
  { id: 'c4', name: 'Urban Styles',  username: 'urbanstyles',  phone: '+91 65432 10987', email: 'team@urbanstyles.com',   monthlyFee: 15000, active: true },
  { id: 'c5', name: 'TechNova',      username: 'technova',     phone: '+91 54321 09876', email: 'support@technova.in',    monthlyFee: 20000, active: true },
];

export const videos = [
  { id: 'v1', client_id: 'c1', name: 'Gym Reel 01',     duration: '00:45', type: 'Reel',          version: 'V3', editor_status: 'Done',        client_status: 'Posted',        date: '15 Jun', amount:  600, year: 2026, month: 6, due_date: 'June 2026', client_locked: true  },
  { id: 'v2', client_id: 'c1', name: 'Gym Reel 02',     duration: '00:30', type: 'Reel',          version: 'V2', editor_status: 'Done',        client_status: 'Approved',      date: '20 Jun', amount:  600, year: 2026, month: 6, due_date: 'June 2026', client_locked: true  },
  { id: 'v3', client_id: 'c1', name: 'Promo Video',     duration: '01:20', type: 'Advertisement', version: 'V1', editor_status: 'In Progress', client_status: null,            date: null,     amount: 1500, year: 2026, month: 6, due_date: 'June 2026', client_locked: false },
  { id: 'v4', client_id: 'c1', name: 'Trainer Intro',   duration: '02:10', type: 'Intro',         version: 'V4', editor_status: 'Done',        client_status: 'Posted',        date: '10 Jun', amount: 2000, year: 2026, month: 6, due_date: 'June 2026', client_locked: true  },
  { id: 'v5', client_id: 'c2', name: 'Site Tour Reel',  duration: '00:50', type: 'Reel',          version: 'V2', editor_status: 'Sent To Client', client_status: 'Correction',  date: '12 Jun', amount:  700, year: 2026, month: 6, due_date: 'June 2026', client_locked: false },
  { id: 'v6', client_id: 'c2', name: 'Project Showcase',duration: '02:30', type: 'Advertisement', version: 'V1', editor_status: 'In Progress', client_status: null,            date: null,     amount:  800, year: 2026, month: 6, due_date: 'June 2026', client_locked: false },
  { id: 'v7', client_id: 'c3', name: 'Coffee Reel 01',  duration: '00:25', type: 'Reel',          version: 'V1', editor_status: 'Not Started', client_status: null,            date: null,     amount:  500, year: 2026, month: 6, due_date: 'June 2026', client_locked: false },
  { id: 'v8', client_id: 'c3', name: 'Cafe Vibes',      duration: '00:40', type: 'Reel',          version: 'V2', editor_status: 'Done',        client_status: 'Posted',        date: '08 Jun', amount:  500, year: 2026, month: 6, due_date: 'June 2026', client_locked: true  },
  { id: 'v9', client_id: 'c4', name: 'Lookbook Reel',   duration: '00:35', type: 'Reel',          version: 'V3', editor_status: 'Sent To Client', client_status: 'Rejected',    date: '18 Jun', amount:  750, year: 2026, month: 6, due_date: 'June 2026', client_locked: false },
  { id: 'v10',client_id: 'c4', name: 'Brand Story',     duration: '01:50', type: 'Advertisement', version: 'V2', editor_status: 'Done',        client_status: 'Approved',      date: '22 Jun', amount: 1200, year: 2026, month: 6, due_date: 'June 2026', client_locked: true  },
  { id: 'v11',client_id: 'c5', name: 'Product Launch',  duration: '03:00', type: 'Advertisement', version: 'V1', editor_status: 'In Progress', client_status: null,            date: null,     amount: 2500, year: 2026, month: 6, due_date: 'June 2026', client_locked: false },
];

export const payments = [
  { id: 'p1', client_id: 'c1', month: 6, year: 2026, total_amount: 3200, status: 'Pending' },
  { id: 'p2', client_id: 'c2', month: 6, year: 2026, total_amount: 1500, status: 'Pending' },
  { id: 'p3', client_id: 'c3', month: 6, year: 2026, total_amount: 1000, status: 'Paid'    },
  { id: 'p4', client_id: 'c5', month: 6, year: 2026, total_amount: 2500, status: 'Pending' },
];

export const activityLog = [
  { id: 'a1', at: '2026-06-22T09:12:00', actor: 'Editor', action: 'marked Done', target: 'Brand Story',       client: 'Urban Styles'  },
  { id: 'a2', at: '2026-06-22T08:40:00', actor: 'Client', action: 'Approved',    target: 'Gym Reel 02',       client: 'ABC Fitness'   },
  { id: 'a3', at: '2026-06-21T18:03:00', actor: 'Client', action: 'Requested Correction', target: 'Site Tour Reel', client: 'XYZ Builders' },
  { id: 'a4', at: '2026-06-21T14:22:00', actor: 'Editor', action: 'Sent To Client', target: 'Lookbook Reel',   client: 'Urban Styles'  },
  { id: 'a5', at: '2026-06-20T11:05:00', actor: 'Editor', action: 'Started',     target: 'Product Launch',    client: 'TechNova'      },
];

// Mock users: username -> {password, role, clientId}
export const users = [
  { username: 'admin',       password: 'admin123', role: 'admin', full_name: 'Robin (Admin)' },
  { username: 'abcfitness',  password: 'client123', role: 'client', client_id: 'c1', full_name: 'ABC Fitness' },
  { username: 'xyzbuilders', password: 'client123', role: 'client', client_id: 'c2', full_name: 'XYZ Builders' },
  { username: 'greencafe',   password: 'client123', role: 'client', client_id: 'c3', full_name: 'Green Cafe' },
  { username: 'urbanstyles', password: 'client123', role: 'client', client_id: 'c4', full_name: 'Urban Styles' },
  { username: 'technova',    password: 'client123', role: 'client', client_id: 'c5', full_name: 'TechNova' },
];

export const getClientById = (id) => clients.find((c) => c.id === id);
export const getVideosByClient = (id) => videos.filter((v) => v.client_id === id);
