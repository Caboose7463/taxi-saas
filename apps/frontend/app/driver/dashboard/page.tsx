"use client";
import { API_URL } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function DriverDashboard() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [incomingBooking, setIncomingBooking] = useState<any>(null);
  const [earnings, setEarnings] = useState(0);
  const [ridesCompleted, setRidesCompleted] = useState(0);
  const [driverName, setDriverName] = useState('Driver');

  useEffect(() => {
    // Get driver name from token
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.name) setDriverName(payload.name);
      }
    } catch {}

    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
    });
    setSocket(newSocket);

    newSocket.on('new_booking_request', (bookingData: any) => {
      setIncomingBooking(bookingData);
    });

    return () => { newSocket.close(); };
  }, []);

  // Broadcast location when online
  useEffect(() => {
    if (!socket || !isOnline) return;
    const interval = setInterval(() => {
      socket.emit('location_update', {
        driverId: 'me',
        x: 30 + Math.random() * 40,
        y: 30 + Math.random() * 40,
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [socket, isOnline]);

  const handleAcceptBooking = async () => {
    if (!incomingBooking) return;
    try {
      const token = document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
      const res = await fetch(`${API_URL}/api/v1/bookings/${incomingBooking.id}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ driverId: 'me' })
      });
      if (res.ok) {
        setEarnings(e => e + (incomingBooking.fare * 0.85));
        setRidesCompleted(r => r + 1);
        setIncomingBooking(null);
      } else {
        alert('Someone else took this booking.');
        setIncomingBooking(null);
      }
    } catch {
      alert('Network error.');
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-950 justify-center items-center">
      <div className="relative w-full h-full max-w-sm bg-gray-900 overflow-hidden shadow-2xl sm:rounded-[40px] sm:border-4 sm:border-gray-800 sm:h-[812px]">

        {/* Map Background */}
        <div className={`absolute inset-0 transition-all duration-700 ${isOnline ? 'opacity-100' : 'opacity-20 grayscale'}`}
          style={{ background: 'linear-gradient(135deg, #1a2332 0%, #162032 40%, #1e2d40 100%)' }}>
          {/* Animated road grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}></div>
          {/* Road highlights */}
          <div className="absolute inset-0">
            <div className="absolute bg-gray-700/60 h-2 w-full" style={{ top: '30%' }}></div>
            <div className="absolute bg-gray-700/60 h-2 w-full" style={{ top: '60%' }}></div>
            <div className="absolute bg-gray-700/60 w-2 h-full" style={{ left: '40%' }}></div>
            <div className="absolute bg-gray-700/60 w-2 h-full" style={{ left: '70%' }}></div>
          </div>
        </div>

        {/* Top Header */}
        <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-start z-20">
          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl">
            <p className="text-white/60 text-[10px] font-medium">DRIVER</p>
            <p className="text-white text-sm font-bold">{driverName}</p>
          </div>

          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2.5 transition-all font-bold text-sm ${isOnline
              ? 'bg-green-500 text-white shadow-green-500/30'
              : 'bg-white text-gray-900'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-red-500'}`}></div>
            {isOnline ? 'ONLINE' : 'GO ONLINE'}
          </button>

          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-right">
            <p className="text-white/60 text-[10px] font-medium">TODAY</p>
            <p className="text-white text-sm font-bold">£{earnings.toFixed(2)}</p>
          </div>
        </div>

        {/* Offline Overlay */}
        {!isOnline && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-white rounded-3xl p-8 mx-6 text-center shadow-2xl">
              <div className="text-5xl mb-4">🚖</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">You're Offline</h2>
              <p className="text-gray-500 text-sm mb-6">Go online to start receiving booking requests from hotels.</p>
              <button onClick={() => setIsOnline(true)}
                className="w-full bg-black text-white py-3.5 rounded-2xl font-bold text-sm">
                Go Online Now
              </button>
            </div>
          </div>
        )}

        {/* Stats bar when online */}
        {isOnline && (
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-white font-bold text-sm">Waiting for bookings...</p>
              <p className="text-white/60 text-xs mt-1">{ridesCompleted} rides completed today</p>
            </div>
          </div>
        )}

        {/* Incoming Booking Sheet */}
        <div className={`absolute bottom-0 left-0 right-0 z-30 transition-transform duration-500 ease-out ${incomingBooking ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="bg-white rounded-t-[32px] p-6 pt-4 shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5"></div>

            <div className="flex justify-between items-center mb-5">
              <div>
                <p className="text-xs text-gray-400 font-medium">NEW REQUEST</p>
                <p className="font-bold text-lg text-gray-900">Booking Incoming</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                <p className="text-xs text-amber-600 font-bold animate-pulse">⏱ Accept quickly</p>
              </div>
            </div>

            <div className="space-y-3 mb-5 bg-gray-50 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
                <div>
                  <p className="text-xs text-gray-400">Pickup</p>
                  <p className="font-semibold text-gray-900 text-sm">{incomingBooking?.pickupAddress}</p>
                </div>
              </div>
              <div className="border-l-2 border-dashed border-gray-300 ml-1.5 h-3"></div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded mt-1 flex-shrink-0"></div>
                <div>
                  <p className="text-xs text-gray-400">Drop-off</p>
                  <p className="font-semibold text-gray-900 text-sm">{incomingBooking?.dropoffAddress}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6 px-2">
              <div>
                <p className="text-xs text-gray-400 font-medium">YOUR PAYOUT</p>
                <p className="text-4xl font-black text-gray-900">£{incomingBooking ? (incomingBooking.fare * 0.85).toFixed(2) : '0.00'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Total fare</p>
                <p className="text-lg font-bold text-gray-600">£{incomingBooking?.fare?.toFixed(2)}</p>
              </div>
            </div>

            <button onClick={handleAcceptBooking}
              className="w-full h-14 bg-black text-white rounded-2xl font-bold text-base shadow-lg hover:bg-gray-800 transition-colors mb-3">
              ✓ Accept Booking
            </button>
            <button onClick={() => setIncomingBooking(null)}
              className="w-full text-gray-400 text-sm font-medium py-2 hover:text-gray-600 transition-colors">
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
