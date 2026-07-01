import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requireRole }) {
  const { session, profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070d0e]">
        <Loader2 className="w-6 h-6 animate-spin text-[#2dd4bf]" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (requireRole && profile?.role !== requireRole) {
    return <Navigate to={profile?.role === 'admin' ? '/admin' : '/portal'} replace />;
  }
  return children;
}
