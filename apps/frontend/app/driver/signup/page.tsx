"use client";
import { API_URL } from '@/lib/api';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverSignup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(API_URL + '/api/v1/auth/driver/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Account created successfully! Your driver ID is ${result.driver.id}`);
        // In a real app, we would store result.access_token in a cookie here
        router.push('/driver');
      } else {
        const err = await res.json();
        alert(err.message || 'Error signing up');
      }
    } catch (error) {
      alert('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-xl text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
            R
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Become a Driver</h1>
          <p className="text-sm text-gray-500 mt-2">Join the premium hotel taxi network.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input name="name" type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-shadow" placeholder="James England" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input name="email" type="email" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-shadow" placeholder="james@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input name="phone" type="tel" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-shadow" placeholder="+44 7700 900077" />
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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
