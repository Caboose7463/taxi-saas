"use client";
import { API_URL } from '@/lib/api';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HotelLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(API_URL + '/api/v1/auth/hotel/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        document.cookie = `token=${result.access_token}; path=/; max-age=604800`;
        // Store staff info for dashboard use
        if (typeof window !== 'undefined') {
          localStorage.setItem('staffInfo', JSON.stringify(result.staff));
        }
        // Read subdomain from response and redirect to hotel dashboard
        const subdomain = result.staff?.subdomain || 'grandhotel';
        router.push(`/hotel/${subdomain}`);
      } else {
        const err = await res.json();
        alert(err.message || 'Invalid credentials');
      }
    } catch (error) {
      alert('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F5F5F7] items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-white rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-10 border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl text-white font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            H
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Hotel Portal</h1>
          <p className="text-sm text-gray-500 mt-2">Log in to manage bookings.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input name="email" type="email" required className="w-full bg-[#FAFAFA] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="reception@grandhotel.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input name="password" type="password" required className="w-full bg-[#FAFAFA] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="••••••••" />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
