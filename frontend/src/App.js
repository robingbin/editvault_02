import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import { Loader2 } from 'lucide-react';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import ClientPortal from './pages/ClientPortal';
import ClientPortalDetail from './pages/ClientPortalDetail';
import ClientHome from './pages/ClientHome';
import AccountSettings from './pages/AccountSettings';
import Invoice from './pages/Invoice';
import NotFound from './pages/NotFound';

function RootRedirect() {
  const { session, profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070d0e]">
        <Loader2 className="w-6 h-6 animate-spin text-[#2dd4bf]" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to={profile?.role === 'admin' ? '/admin' : '/portal'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />

          {/* Invoice — standalone print view, no sidebar */}
          <Route
            path="/invoice/:billId"
            element={
              <ProtectedRoute>
                <Invoice />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRole="admin">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="portal" element={<ClientPortal />} />
            <Route path="portal/:id" element={<ClientPortalDetail />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>

          {/* Client routes */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute requireRole="client">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ClientHome />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster theme="dark" position="top-right" />
    </AuthProvider>
  );
}

export default App;
