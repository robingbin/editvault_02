import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070d0e] p-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0f1f20] border border-[#243334] flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-[#2dd4bf]" />
        </div>
        <div className="mt-4 text-6xl font-bold text-[#e6f7f6]">404</div>
        <div className="mt-2 text-[#7c9394]">The page you’re looking for doesn’t exist.</div>
        <Link to="/" className="inline-block mt-6 px-4 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] font-semibold text-sm">Back home</Link>
      </div>
    </div>
  );
}
