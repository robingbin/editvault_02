import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, Users, Monitor, Clapperboard, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const adminItems = [
  { to: '/admin',          label: 'Dashboard',        icon: LayoutGrid, end: true },
  { to: '/admin/clients',  label: 'Clients',          icon: Users },
  { to: '/admin/portal',   label: 'Client Portal',    icon: Monitor },
  { to: '/admin/settings', label: 'Account Settings', icon: Settings },
];
const clientItems = [
  { to: '/portal', label: 'Dashboard', icon: Monitor, end: true },
];

export default function Sidebar() {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const items = isAdmin ? adminItems : clientItems;

  const onLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-[#0a1112] border-r border-[#152223]">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-[#152223]">
        <div className="w-9 h-9 rounded-lg bg-[#0f1f20] border border-[#243334] flex items-center justify-center">
          <Clapperboard className="w-5 h-5 text-[#2dd4bf]" />
        </div>
        <div>
          <div className="text-[15px] font-semibold tracking-tight text-[#e6f7f6]">EditVault</div>
          <div className="text-[10.5px] uppercase tracking-wider text-[#6b8788]">{isAdmin ? 'Admin Console' : 'Client Portal'}</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#0f2020] text-[#2dd4bf] border border-[#1e3a3b]'
                  : 'text-[#a8bcbd] hover:bg-[#101a1b] hover:text-[#e6f7f6] border border-transparent'
              }`
            }
          >
            <it.icon className="w-4 h-4" />
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-[#152223]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#134e4a] to-[#0d3d3a] flex items-center justify-center text-[#5eead4] text-sm font-semibold">
            {(profile?.full_name || profile?.username || '?').slice(0,1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-[#e6f7f6] truncate">{profile?.full_name || profile?.username}</div>
            <div className="text-[11px] text-[#6b8788] truncate capitalize">{profile?.role}</div>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            className="p-2 rounded-md text-[#a8bcbd] hover:text-[#e6f7f6] hover:bg-[#101a1b] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
