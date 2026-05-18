"use client";
import { API_URL } from '@/lib/api';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError('');
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/driver/login`, {
        method:'POST',
        headers:{'Content-Type':'application/json','bypass-tunnel-reminder':'true'},
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      if (res.ok) {
        const result = await res.json();
        document.cookie = `token=${result.access_token}; path=/; max-age=604800`;
        if (result.driver) localStorage.setItem('driverInfo', JSON.stringify(result.driver));
        router.push('/driver/dashboard');
      } else {
        const err = await res.json();
        setError(err.message || 'Invalid credentials');
      }
    } catch { setError('Failed to connect to server'); }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-[#F5F5F7] items-center justify-center p-6" style={{fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif'}}>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Portal</h1>
          <p className="text-sm text-gray-400 mt-1.5">Log in to go online and accept rides</p>
        </div>
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
            <input name="email" type="email" required autoFocus className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all" placeholder="driver@example.com"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
            <input name="password" type="password" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all" placeholder="••••••••"/>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 mt-2">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-400">Don't have an account?</p>
          <a href="/driver/signup" className="text-sm font-bold text-black hover:underline">Apply to become a driver →</a>
        </div>
      </div>
    </div>
  );
}
