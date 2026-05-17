"use client";
import { API_URL } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function DriverDashboard() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [incomingBooking, setIncomingBooking] = useState<any>(null);
  
  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    // Listen for incoming booking broadcasts from the backend
    newSocket.on('new_booking_request', (bookingData) => {
      // Only show if we are online and not already on a job
      if (isOnline) {
        setIncomingBooking(bookingData);
      }
    });

    return () => { newSocket.close(); };
  }, [isOnline]);

  const handleAcceptBooking = async () => {
    try {
      const res = await fetch(`API_URL + '/api/v1/bookings/${incomingBooking.id}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: 'me' }) // usually from context/JWT
      });
      if (res.ok) {
        alert("Booking Accepted! Navigate to pickup.");
        setIncomingBooking(null);
      } else {
        alert("Error accepting booking (someone else may have taken it).");
      }
    } catch (e) {
      alert("Network error.");
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 justify-center items-center">
      <div className="relative w-full h-full max-w-md max-h-[926px] bg-[#e8eaed] overflow-hidden shadow-2xl sm:rounded-[40px] sm:border-[8px] sm:border-gray-900">
        
        {/* Map Background */}
        <div className={`absolute inset-0 w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/4/4b/Map_of_the_city_of_London.png')] bg-cover bg-center transition-opacity duration-500 ${isOnline ? 'opacity-80' : 'opacity-20 grayscale'}`}></div>

        {/* Top Header */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
          <button className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`px-6 py-3 rounded-full shadow-md flex items-center gap-3 transition-colors ${isOnline ? 'bg-white text-gray-900' : 'bg-gray-800 text-white'}`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="font-bold text-sm tracking-wide">{isOnline ? 'ONLINE' : 'GO ONLINE'}</span>
          </button>

          <div className="bg-white px-4 py-2 rounded-xl shadow-md flex flex-col items-end">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Earnings</span>
            <span className="font-bold text-sm">£155.20</span>
          </div>
        </div>

        {/* Not Online Overlay */}
        {!isOnline && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10 backdrop-blur-sm">
             <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
                <h2 className="text-xl font-bold mb-2">You are Offline</h2>
                <p className="text-gray-500 text-sm">Go online to receive booking requests.</p>
             </div>
          </div>
        )}

        {/* Bottom Sheet Modal (New Booking) */}
        <div className={`absolute bottom-0 left-0 right-0 z-30 transition-transform duration-500 ease-out transform ${incomingBooking ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="bg-white rounded-t-[32px] p-6 pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] h-auto min-h-[400px]">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            
            <div className="flex justify-between items-center mb-6">
              <div className="font-bold text-lg tracking-tight">RIDEGO</div>
              <div className="text-sm font-semibold text-gray-600">New Booking Request</div>
            </div>

            <div className="space-y-5 mb-6 relative">
              <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-gray-200 z-0"></div>
              <div className="flex gap-4 items-start relative z-10">
                <div className="w-4 h-4 bg-gray-900 rounded-full mt-1 border-4 border-white shadow-sm"></div>
                <div>
                  <p className="font-bold text-gray-900">{incomingBooking?.pickupAddress}</p>
                  <p className="text-sm text-gray-500">2.8 miles away</p>
                </div>
              </div>
              <div className="flex gap-4 items-start relative z-10">
                <div className="w-4 h-4 bg-blue-600 rounded mt-1 border-2 border-white shadow-sm"></div>
                <div>
                  <p className="font-bold text-gray-900">{incomingBooking?.dropoffAddress}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8 pt-4 border-t border-gray-50">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Your Payout</p>
                <h2 className="text-4xl font-bold tracking-tight">£{incomingBooking ? (incomingBooking.fare * 0.9).toFixed(2) : '0.00'}</h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-red-500 font-bold mt-1 animate-pulse">Accept Quickly!</p>
              </div>
            </div>

            <button onClick={handleAcceptBooking} className="w-full relative h-16 bg-gradient-to-r from-blue-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow group overflow-hidden">
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <span className="font-bold text-white text-lg tracking-wide shadow-sm">SWIPE TO ACCEPT &rarr;</span>
            </button>
            <button onClick={() => setIncomingBooking(null)} className="w-full mt-4 text-gray-500 text-sm font-semibold hover:text-gray-800">
               Decline Request
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
