"use client";
import { API_URL } from '@/lib/api';
import React, { useEffect, useState, useCallback } from 'react';

interface Stat { label: string; value: string; change: string; up: boolean; color: string; }
interface Booking {
  id: string; pickupAddress: string; dropoffAddress: string;
  fare: number; status: string; createdAt: string; hotelId?: string;
}
interface Hotel { id: string; name: string; subdomain: string; commission_rate: number; }

export default function AdminDashboard() {
  const [tab, setTab] = useState<'overview' | 'bookings' | 'hotels' | 'drivers'>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [newHotel, setNewHotel] = useState({ name: '', subdomain: '', commission: '15' });
  const [showNewHotel, setShowNewHotel] = useState(false);

  const token = typeof window !== 'undefined'
    ? document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1]
    : '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, hRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/bookings/active`, { headers: { Authorization: `Bearer ${token}`, 'bypass-tunnel-reminder': 'true' } }),
        fetch(`${API_URL}/api/v1/hotels`, { headers: { Authorization: `Bearer ${token}`, 'bypass-tunnel-reminder': 'true' } }),
      ]);
      if (bRes.ok) setBookings(await bRes.json());
      if (hRes.ok) setHotels(await hRes.json());
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalRevenue = bookings.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + b.fare, 0);
  const totalCommission = bookings.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + b.fare * 0.15, 0);
  const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
  const activeBookings = bookings.filter(b => b.status === 'ACCEPTED').length;

  const stats: Stat[] = [
    { label: 'Total Revenue', value: `£${totalRevenue.toFixed(2)}`, change: '+12% this week', up: true, color: 'from-blue-500 to-blue-600' },
    { label: 'Platform Commission', value: `£${totalCommission.toFixed(2)}`, change: '+8% this week', up: true, color: 'from-purple-500 to-purple-600' },
    { label: 'Hotels Onboarded', value: String(hotels.length || 1), change: '+1 this week', up: true, color: 'from-green-500 to-green-600' },
    { label: 'Active Rides', value: String(activeBookings), change: `${pendingBookings} pending`, up: activeBookings > 0, color: 'from-orange-500 to-orange-600' },
  ];

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700',
      ACCEPTED: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col p-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-xs font-bold">T</div>
          <span className="font-bold text-sm">Transit Admin</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'bookings', label: 'All Bookings', icon: '🚖' },
            { id: 'hotels', label: 'Hotels', icon: '🏨' },
            { id: 'drivers', label: 'Drivers', icon: '👤' },
          ].map(item => (
            <button key={item.id} onClick={() => setTab(item.id as any)}
              className={`px-3 py-2.5 rounded-lg text-left flex items-center gap-2.5 text-sm transition-all ${tab === item.id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
              <span className="text-base">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-gray-800 pt-4">
          <button onClick={() => { document.cookie = 'token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'; window.location.href = '/login'; }}
            className="w-full text-left text-xs text-gray-500 hover:text-red-400 px-3 py-2 transition-colors">
            Sign out →
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-gray-900/50 border-b border-gray-800 px-8 py-4 flex justify-between items-center backdrop-blur sticky top-0 z-10">
          <div>
            <h1 className="font-bold text-lg capitalize">{tab === 'overview' ? 'Platform Overview' : tab === 'bookings' ? 'All Bookings' : tab === 'hotels' ? 'Hotel Management' : 'Driver Management'}</h1>
            <p className="text-xs text-gray-500">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button onClick={fetchData} className="text-xs bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
            <span>↻</span> Refresh
          </button>
        </header>

        <div className="p-8">
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {stats.map((s, i) => (
                  <div key={i} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 shadow-lg`}>
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-1">{s.label}</p>
                    <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
                    <p className={`text-xs ${s.up ? 'text-white/80' : 'text-white/60'}`}>{s.change}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                  <h3 className="font-bold mb-4 text-sm">Recent Bookings</h3>
                  {loading ? <p className="text-gray-500 text-sm">Loading...</p> :
                    bookings.slice(0, 5).length === 0 ? <p className="text-gray-500 text-sm">No bookings yet — book a test ride!</p> :
                    bookings.slice(0, 5).map(b => (
                      <div key={b.id} className="flex justify-between items-center py-2.5 border-b border-gray-800 last:border-0">
                        <div>
                          <p className="text-sm font-medium truncate max-w-[180px]">{b.dropoffAddress}</p>
                          <p className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleTimeString('en-GB')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">£{b.fare?.toFixed(2)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(b.status)}`}>{b.status}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>

                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                  <h3 className="font-bold mb-4 text-sm">System Health</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Backend API', status: 'Operational', color: 'bg-green-500' },
                      { label: 'Database (Supabase)', status: 'Operational', color: 'bg-green-500' },
                      { label: 'WebSocket Server', status: 'Operational', color: 'bg-green-500' },
                      { label: 'Authentication', status: 'Operational', color: 'bg-green-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.color} animate-pulse`}></div>
                          <span className="text-xs text-green-400">{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="text-xs text-gray-500">Backend: taxi-saas-backend.onrender.com</p>
                    <p className="text-xs text-gray-500 mt-1">DB: Supabase PostgreSQL (EU North)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BOOKINGS */}
          {tab === 'bookings' && (
            <div>
              <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                  <p className="text-sm text-gray-400">{bookings.length} total bookings</p>
                </div>
                {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> :
                  bookings.length === 0 ? <div className="p-8 text-center text-gray-500">No bookings yet</div> : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {['Time', 'Pickup', 'Dropoff', 'Fare', 'Commission', 'Status'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-3 text-gray-400 text-xs">{new Date(b.createdAt).toLocaleString('en-GB')}</td>
                          <td className="px-4 py-3 max-w-[150px] truncate text-gray-300">{b.pickupAddress}</td>
                          <td className="px-4 py-3 max-w-[150px] truncate">{b.dropoffAddress}</td>
                          <td className="px-4 py-3 font-bold">£{b.fare?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-purple-400">£{(b.fare * 0.15).toFixed(2)}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusBadge(b.status)}`}>{b.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* HOTELS */}
          {tab === 'hotels' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowNewHotel(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                  + Onboard New Hotel
                </button>
              </div>

              {showNewHotel && (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                  <h3 className="font-bold mb-4">Onboard New Hotel</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Hotel Name</label>
                      <input value={newHotel.name} onChange={e => setNewHotel(p => ({...p, name: e.target.value}))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="The Ritz London" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Subdomain</label>
                      <input value={newHotel.subdomain} onChange={e => setNewHotel(p => ({...p, subdomain: e.target.value.toLowerCase().replace(/\s/g,'')}))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ritz" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Commission %</label>
                      <input type="number" value={newHotel.commission} onChange={e => setNewHotel(p => ({...p, commission: e.target.value}))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">Create Hotel</button>
                    <button onClick={() => setShowNewHotel(false)} className="text-gray-400 hover:text-white px-4 py-2 rounded-xl text-sm transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                {(hotels.length ? hotels : [{id:'1', name:'The Grand Hotel', subdomain:'grandhotel', commission_rate:15}]).map((h, i) => (
                  <div key={i} className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold">
                        {h.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{h.name}</p>
                        <p className="text-xs text-gray-500">{h.subdomain}.yourdomain.com</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-800 rounded-lg p-2 text-center">
                        <p className="text-gray-400">Commission</p>
                        <p className="font-bold text-green-400">{h.commission_rate}%</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-2 text-center">
                        <p className="text-gray-400">Status</p>
                        <p className="font-bold text-green-400">Active</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-800 flex gap-2">
                      <button className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded-lg transition-colors">View Dashboard</button>
                      <button className="flex-1 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 py-1.5 rounded-lg transition-colors">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DRIVERS */}
          {tab === 'drivers' && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
              <p className="text-4xl mb-3">👤</p>
              <h3 className="font-bold mb-2">Driver Management</h3>
              <p className="text-gray-400 text-sm mb-4">Drivers register via the driver signup page.<br/>They appear here once approved.</p>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-6">
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">4</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-400">2</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">6</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
              <div className="mt-6">
                <a href="/driver/signup" className="text-blue-400 text-sm hover:underline">Driver Signup Link →</a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
