import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Clapperboard, Loader2, LogIn, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';

export default function Login() {
  const { session, profile, signIn } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  if (session) return <Navigate to={profile?.role === 'admin' ? '/admin' : '/portal'} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await signIn({ username, password });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    const role = data?.profile?.role;
    toast.success(`Welcome${role === 'admin' ? ' Admin' : ''}!`);
    navigate(role === 'admin' ? '/admin' : '/portal', { replace: true });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#070d0e] flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-[#0f3d3a] opacity-40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full bg-[#1a1a4a] opacity-30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.06),transparent_60%)]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0f1f20] border border-[#243334] flex items-center justify-center">
            <Clapperboard className="w-5 h-5 text-[#2dd4bf]" />
          </div>
          <div className="text-xl font-semibold tracking-tight text-[#e6f7f6]">EditVault</div>
        </div>

        <div className="bg-[#0a1112] border border-[#152223] rounded-2xl p-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]">
          <h1 className="text-[22px] font-semibold text-[#e6f7f6]">Sign in to EditVault</h1>
          <p className="text-sm text-[#7c9394] mt-1">Enter the username and password provided by your admin.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-[13px] text-[#a8bcbd] mb-1.5">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="your username"
                autoComplete="username"
                className="focus-teal w-full px-3.5 py-2.5 rounded-lg bg-[#070d0e] border border-[#243334] text-[#e6f7f6] placeholder-[#4b6162] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[13px] text-[#a8bcbd] mb-1.5">Password</label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="focus-teal w-full px-3.5 py-2.5 pr-11 rounded-lg bg-[#070d0e] border border-[#243334] text-[#e6f7f6] placeholder-[#4b6162] transition-colors"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#6b8788] hover:text-[#e6f7f6]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] disabled:opacity-70 text-[#062626] font-semibold text-sm transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Login
            </button>

            <div className="flex items-center justify-between text-[13px] pt-1">
              <button type="button" onClick={() => setHelpOpen(true)} className="inline-flex items-center gap-1.5 text-[#2dd4bf] hover:underline">
                <HelpCircle className="w-3.5 h-3.5" /> Forgot Password?
              </button>
              <span className="text-[#4b6162]">v1.0</span>
            </div>
          </form>
        </div>

        <p className="text-center text-[11px] text-[#4b6162] mt-6">© {new Date().getFullYear()} EditVault — Video Editing Workflow Management</p>
      </div>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6]">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription className="text-[#7c9394]">
              This is an internal application. Please contact your admin to reset your password.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-[#a8bcbd]">If you’re the admin, sign in with your admin account and change credentials from Account Settings.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
