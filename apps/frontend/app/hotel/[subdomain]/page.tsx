"use client";
import { API_URL } from '@/lib/api';
import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

interface Booking {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  fare: number;
  status: string;
  createdAt: string;
  driverId?: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING': return 'bg-amber-100 text-amber-700';
    case 'ACCEPTED': return 'bg-blue-100 text-blue-700';
    case 'COMPLETED': return 'bg-green-100 text-green-700';
    case 'CANCELLED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export default function HotelDashboard() {
  const [activeTab, setActiveTab] = useState<'book' | 'active' | 'history'>('book');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [driverPos, setDriverPos] = useState({ x: 35, y: 55 });
  const [driver2Pos, setDriver2Pos] = useState({ x: 65, y: 40 });
  const [estimate, setEstimate] = useState<{ fare: number; distance: string } | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [staffInfo, setStaffInfo] = useState({ name: 'Reception', hotel: 'Hotel', hotelId: '', hotelAddress: '', commissionRate: 15 });

  // Animate driver dots
  useEffect(() => {
    const socket = io(API_URL);
    socket.on('driver_location', (payload: any) => {
      if (payload.driverId === 'D1') setDriverPos({ x: payload.x, y: payload.y });
      if (payload.driverId === 'D2') setDriver2Pos({ x: payload.x, y: payload.y });
    });

    // Simulated driver movement for demo
    const interval = setInterval(() => {
      setDriverPos(p => ({
        x: Math.min(85, Math.max(15, p.x + (Math.random() - 0.48) * 3)),
        y: Math.min(85, Math.max(15, p.y + (Math.random() - 0.48) * 3)),
      }));
      setDriver2Pos(p => ({
        x: Math.min(85, Math.max(15, p.x + (Math.random() - 0.52) * 3)),
        y: Math.min(85, Math.max(15, p.y + (Math.random() - 0.52) * 3)),
      }));
    }, 2000);

    // Load staff info from localStorage (saved at login)
    try {
      const saved = localStorage.getItem('staffInfo');
      if (saved) {
        const info = JSON.parse(saved);
        setStaffInfo(info);
        // Use the hotel's real address as default pickup
        if (info.hotelAddress) setPickup(info.hotelAddress);
      }
    } catch {}

    return () => { socket.close(); clearInterval(interval); };
  }, []);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
      // Use hotel-specific endpoint - backend extracts hotelId from JWT
      const res = await fetch(`${API_URL}/api/v1/bookings/hotel`, {
        headers: { Authorization: `Bearer ${token}`, 'bypass-tunnel-reminder': 'true' }
      });
      if (res.ok) setBookings(await res.json());
    } catch {}
    setBookingsLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab !== 'book') fetchBookings();
  }, [activeTab, fetchBookings]);

  const handleEstimate = async () => {
    if (!pickup || !dropoff) return;
    setEstimating(true);
    setEstimate(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/bookings/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true' },
        body: JSON.stringify({ pickup, dropoff })
      });
      const data = await res.json();
      setEstimate({ fare: data.fare || 28.50, distance: data.distance || '8.2 miles' });
    } catch {
      setEstimate({ fare: 28.50, distance: '8.2 miles' });
    }
    setEstimating(false);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;
    setLoading(true);
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];

      // Step 1: Get price estimate
      const estRes = await fetch(`${API_URL}/api/v1/bookings/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true' },
        body: JSON.stringify({ pickup, dropoff })
      });
      const est = await estRes.json();

      // Step 2: Create booking - server extracts hotelId from JWT, no need to send it
      const res = await fetch(`${API_URL}/api/v1/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pickupAddress: pickup,
          dropoffAddress: dropoff,
          fare: est.fare,
          hotelCommission: est.hotelCommission,
        })
      });

      if (res.ok) {
        setSuccessMsg(`✅ Booking confirmed! Dispatched to nearby drivers.`);
        setDropoff('');
        setEstimate(null);
        setTimeout(() => setSuccessMsg(''), 6000);
        fetchBookings();
      } else {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }));
        alert('Booking failed: ' + (err.message || res.status));
      }
    } catch (err) {
      alert('Network error — check your connection and try again');
    }
    setLoading(false);
  };

  const activeBookings = bookings.filter(b => ['PENDING', 'ACCEPTED'].includes(b.status));
  const historyBookings = bookings.filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status));
  const todayRevenue = bookings.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + b.fare * 0.15, 0);

  return (
    <div className="flex h-screen w-full bg-[#F5F5F7] font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display',sans-serif]">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col p-5 shadow-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-sm">T</div>
          <span className="font-bold text-sm tracking-wide text-gray-900">TRANSIT PRO</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {[
            { id: 'book', label: 'Book a Taxi', icon: '🚖' },
            { id: 'active', label: 'Active Bookings', icon: '📍' },
            { id: 'history', label: 'History', icon: '📋' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`px-3 py-2.5 rounded-xl text-left flex items-center gap-3 text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
              {item.id === 'active' && activeBookings.length > 0 && (
                <span className="ml-auto bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeBookings.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {staffInfo.name[0]}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900">{staffInfo.name}</p>
              <p className="text-[10px] text-gray-400">{staffInfo.hotel}</p>
            </div>
          </div>
          <button
            onClick={() => { document.cookie = 'token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'; window.location.href = '/login'; }}
            className="mt-3 w-full text-xs text-gray-400 hover:text-red-500 text-left transition-colors"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {activeTab === 'book' ? 'Book a Taxi' : activeTab === 'active' ? 'Active Bookings' : 'Booking History'}
            </h1>
            <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2 text-center">
              <p className="text-[10px] text-green-600 font-bold uppercase">Today's Revenue</p>
              <p className="text-lg font-bold text-green-700">£{todayRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-center">
              <p className="text-[10px] text-blue-600 font-bold uppercase">Total Trips</p>
              <p className="text-lg font-bold text-blue-700">{bookings.length}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {/* BOOK TAB */}
          {activeTab === 'book' && (
            <div className="flex gap-6 max-w-5xl">
              {/* Booking Form */}
              <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-bold mb-1">New Booking</h2>
                <p className="text-xs text-gray-400 mb-6">Book a premium taxi for your guests instantly.</p>

                {successMsg && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-medium">
                    {successMsg}
                  </div>
                )}

                <form onSubmit={handleBook} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Pickup Location</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-green-500">●</span>
                      <input
                        value={pickup}
                        onChange={e => { setPickup(e.target.value); setEstimate(null); }}
                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                        placeholder="Pickup address..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Drop-off Location</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-red-500">■</span>
                      <input
                        value={dropoff}
                        onChange={e => { setDropoff(e.target.value); setEstimate(null); }}
                        className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 shadow-sm"
                        placeholder="Where to? (e.g. Heathrow Terminal 2)"
                        required
                      />
                    </div>
                  </div>

                  {/* Estimate */}
                  {estimate ? (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Estimated Fare</p>
                          <p className="text-2xl font-bold text-gray-900">£{estimate.fare.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{estimate.distance} • Hotel earns £{(estimate.fare * 0.15).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-medium">Premium</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEstimate}
                      disabled={!dropoff || estimating}
                      className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all disabled:opacity-40"
                    >
                      {estimating ? 'Calculating...' : '→ Get price estimate'}
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !dropoff}
                    className="w-full py-3.5 bg-black text-white rounded-xl font-bold text-sm shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Dispatching...' : 'Confirm & Dispatch Taxi'}
                  </button>
                </form>
              </div>

              {/* Live Map */}
              <div className="w-80 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                  <p className="text-xs font-bold text-gray-700">LIVE DRIVER MAP</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">4 Online</span>
                  </div>
                </div>
                <div className="relative flex-1 bg-slate-100 min-h-64">
                  {/* Grid lines for map feel */}
                  <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.04) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                  {/* Roads */}
                  <div className="absolute inset-0">
                    <div className="absolute bg-white h-1.5 w-full" style={{ top: '40%', opacity: 0.9 }}></div>
                    <div className="absolute bg-white w-1.5 h-full" style={{ left: '35%', opacity: 0.9 }}></div>
                    <div className="absolute bg-white h-1 w-full" style={{ top: '70%', opacity: 0.7 }}></div>
                    <div className="absolute bg-white w-1 h-full" style={{ left: '65%', opacity: 0.7 }}></div>
                  </div>
                  {/* Hotel pin */}
                  <div className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2" style={{ left: '50%', top: '50%' }}>
                    <div className="w-10 h-10 bg-black rounded-full text-white flex items-center justify-center font-bold text-sm border-3 border-white shadow-lg">H</div>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
                  </div>
                  {/* Driver 1 */}
                  <div className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-[2000ms] ease-in-out" style={{ left: `${driverPos.x}%`, top: `${driverPos.y}%` }}>
                    <div className="w-7 h-7 bg-blue-500 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-md border-2 border-white">1</div>
                  </div>
                  {/* Driver 2 */}
                  <div className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-[2000ms] ease-in-out" style={{ left: `${driver2Pos.x}%`, top: `${driver2Pos.y}%` }}>
                    <div className="w-7 h-7 bg-purple-500 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-md border-2 border-white">2</div>
                  </div>
                  {/* Static drivers */}
                  <div className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2" style={{ left: '75%', top: '25%' }}>
                    <div className="w-7 h-7 bg-orange-500 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-md border-2 border-white">3</div>
                  </div>
                  <div className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2" style={{ left: '20%', top: '80%' }}>
                    <div className="w-7 h-7 bg-teal-500 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-md border-2 border-white">4</div>
                  </div>
                </div>
                <div className="p-3 border-t border-gray-50">
                  <p className="text-xs text-gray-400 text-center">Nearest driver ~3 mins away</p>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE BOOKINGS TAB */}
          {activeTab === 'active' && (
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{activeBookings.length} active booking{activeBookings.length !== 1 ? 's' : ''}</p>
                <button onClick={fetchBookings} className="text-xs text-blue-500 hover:text-blue-700 font-medium">↻ Refresh</button>
              </div>
              {bookingsLoading ? (
                <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
              ) : activeBookings.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">🚖</p>
                  <p className="text-gray-500 font-medium">No active bookings</p>
                  <p className="text-sm text-gray-400 mt-1">New bookings will appear here in real time</p>
                  <button onClick={() => setActiveTab('book')} className="mt-4 px-4 py-2 bg-black text-white text-sm rounded-xl font-medium">Book Now →</button>
                </div>
              ) : activeBookings.map(b => (
                <div key={b.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-3">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${getStatusColor(b.status)}`}>{b.status}</span>
                    <span className="text-lg font-bold text-gray-900">£{b.fare?.toFixed(2)}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm"><span className="text-green-500 font-bold">●</span><span className="text-gray-700">{b.pickupAddress}</span></div>
                    <div className="flex items-center gap-2 text-sm"><span className="text-red-500 font-bold">■</span><span className="text-gray-700">{b.dropoffAddress}</span></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">{new Date(b.createdAt).toLocaleTimeString('en-GB')} · Hotel commission: £{(b.fare * 0.15).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{historyBookings.length} completed trip{historyBookings.length !== 1 ? 's' : ''}</p>
                <button onClick={fetchBookings} className="text-xs text-blue-500 hover:text-blue-700 font-medium">↻ Refresh</button>
              </div>
              {bookingsLoading ? (
                <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
              ) : historyBookings.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">📋</p>
                  <p className="text-gray-500 font-medium">No history yet</p>
                  <p className="text-sm text-gray-400 mt-1">Completed trips will appear here</p>
                </div>
              ) : historyBookings.map(b => (
                <div key={b.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-3 opacity-80">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${getStatusColor(b.status)}`}>{b.status}</span>
                    <span className="text-lg font-bold text-gray-900">£{b.fare?.toFixed(2)}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm"><span className="text-green-500 font-bold">●</span><span className="text-gray-700">{b.pickupAddress}</span></div>
                    <div className="flex items-center gap-2 text-sm"><span className="text-red-500 font-bold">■</span><span className="text-gray-700">{b.dropoffAddress}</span></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">{new Date(b.createdAt).toLocaleString('en-GB')} · Hotel earned: £{(b.fare * 0.15).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
