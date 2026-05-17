"use client";
import { API_URL } from '@/lib/api';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(API_URL + '/api/v1/auth/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        document.cookie = `token=${result.access_token}; path=/; max-age=604800`;
        // Navigate to the real driver dashboard
        router.push('/driver/dashboard');
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
    <div className="flex h-screen w-full bg-gray-50 items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-xl text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
            R
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Driver Portal</h1>
          <p className="text-sm text-gray-500 mt-2">Log in to go online and accept rides.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input name="email" type="email" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-shadow" placeholder="driver@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input name="password" type="password" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-shadow" placeholder="••••••••" />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm font-medium mt-6">
          <a href="/driver/signup" className="text-blue-600 hover:text-blue-800">Apply to become a driver</a>
        </p>
      </div>
    </div>
  );
}
