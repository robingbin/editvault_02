import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationsBell from './NotificationsBell';
import { useAuth } from '../context/AuthContext';
import { Menu } from 'lucide-react';

export default function Layout() {
  const { profile } = useAuth();
  return (
    <div className="min-h-screen flex bg-[#070d0e] text-[#e6f7f6]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 sticky top-0 z-20 bg-[#0a1112]/85 backdrop-blur border-b border-[#152223] flex items-center px-4 md:px-8 gap-3">
          <button className="md:hidden p-2 -ml-2 rounded-md text-[#a8bcbd] hover:bg-[#101a1b]">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <NotificationsBell />
          <div className="hidden sm:flex items-center gap-2 pl-3 ml-1 border-l border-[#152223]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#134e4a] to-[#0d3d3a] flex items-center justify-center text-[#5eead4] text-xs font-semibold">
              {(profile?.full_name || profile?.username || '?').slice(0,1).toUpperCase()}
            </div>
            <div className="leading-tight">
              <div className="text-sm text-[#e6f7f6]">{profile?.full_name || profile?.username}</div>
              <div className="text-[11px] text-[#6b8788] capitalize">{profile?.role}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
