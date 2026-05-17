"use client";
import { API_URL } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function HotelDashboard() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [driverPos, setDriverPos] = useState({ x: 30, y: 70 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const apiUrl = API_URL;
    const newSocket = io(apiUrl);
    setSocket(newSocket);
    
    newSocket.on('driver_location', (payload) => {
      if (payload.driverId === 'D1') {
        setDriverPos({ x: payload.x, y: payload.y });
      }
    });

    return () => { newSocket.close(); };
  }, []);

  return (
    <div className="flex h-screen w-full bg-[var(--background)]">
      <aside className="w-64 bg-[var(--sidebar)] border-r border-[var(--border)] flex flex-col p-6 shadow-sm z-10">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-lg">H</div>
          <span className="font-semibold tracking-wide text-sm">HOTEL TRANSIT</span>
        </div>
        <nav className="flex flex-col gap-2">
          <a href="#" className="px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-3 text-sm font-medium">Dashboard</a>
          <a href="#" className="px-4 py-2.5 rounded-lg bg-blue-50 text-blue-600 flex items-center gap-3 text-sm font-medium">Book a Taxi</a>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col p-8 overflow-y-auto">
        <header className="flex justify-end items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">Sarah Jenkins</p>
              <p className="text-xs text-gray-500">Receptionist</p>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full border border-gray-300"></div>
          </div>
        </header>

        <div className="flex gap-8 max-w-7xl w-full h-full">
          <div className="flex-1 bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col h-[700px]">
            <h1 className="text-2xl font-bold mb-1">Book Your Luxury Taxi</h1>
            <p className="text-gray-500 text-sm mb-8">Schedule a ride from The Grand Hotel quickly and easily.</p>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const pickup = (e.target as any).pickup.value;
              const dropoff = (e.target as any).dropoff.value;
              
              if (!pickup || !dropoff) return alert("Please enter pickup and dropoff locations");

              setLoading(true);
              
              try {
                // 1. Get dynamic pricing from Google Maps API
                const apiUrl = API_URL;
                const estRes = await fetch(`${apiUrl}/api/v1/bookings/estimate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ pickup, dropoff })
                });
                const estimate = await estRes.json();
                
                // 2. Submit booking
                const res = await fetch(`${apiUrl}/api/v1/bookings`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    hotelId: "mock-hotel-id-123", // in reality, from JWT/Auth context
                    pickupAddress: pickup,
                    dropoffAddress: dropoff,
                    fare: estimate.fare,
                    hotelCommission: estimate.hotelCommission,
                  })
                });
                
                if (res.ok) {
                  alert("Booking Confirmed & Dispatched to Drivers!");
                  (e.target as HTMLFormElement).reset();
                } else {
                  alert("Error creating booking.");
                }
              } catch (err) {
                alert("Network Error.");
              } finally {
                setLoading(false);
              }
            }} className="space-y-5 flex-1 flex flex-col">
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Pickup Location</label>
                <input name="pickup" type="text" defaultValue="The Grand Hotel Lobby" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Dropoff Location</label>
                <input name="dropoff" type="text" placeholder="Enter destination (e.g. Heathrow T2)" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" required />
              </div>

              <div className="pt-4 grid grid-cols-2 gap-4">
                 <div className="border-2 border-blue-600 bg-blue-50/50 rounded-xl p-4 relative shadow-sm">
                    <div className="absolute top-3 right-3 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <h3 className="font-semibold text-gray-900">Premium</h3>
                    <p className="text-xs text-gray-500 mb-4">Dynamic Maps Pricing</p>
                    <div className="text-2xl font-bold">Auto-calculated</div>
                 </div>
              </div>

              <div className="mt-auto pt-6">
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition-colors text-lg disabled:opacity-50">
                  {loading ? 'Calculating Fare...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>

          <div className="w-[400px] bg-white rounded-2xl p-2 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col h-[700px] relative overflow-hidden">
            <div className="absolute inset-0 bg-[#e8eaed] rounded-xl overflow-hidden m-2">
              <div className="w-full h-full opacity-40 bg-[url('https://upload.wikimedia.org/wikipedia/commons/4/4b/Map_of_the_city_of_London.png')] bg-cover bg-center"></div>
              
              {/* LIVE ANIMATED DRIVER D1 */}
              <div 
                className="absolute w-8 h-8 bg-black rounded-full text-white flex items-center justify-center text-xs shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear z-20"
                style={{ left: `${driverPos.x}%`, top: `${driverPos.y}%` }}
              >
                D1
              </div>
              
              {/* Static Driver D2 */}
              <div className="absolute top-[80%] left-[20%] w-8 h-8 bg-black rounded-full text-white flex items-center justify-center text-xs shadow-lg transform -translate-x-1/2 -translate-y-1/2">
                D2
              </div>

              {/* Hotel Pin */}
              <div className="absolute top-[45%] left-[45%] w-10 h-10 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold border-4 border-white shadow-xl transform -translate-x-1/2 -translate-y-1/2 z-10">
                H
              </div>
            </div>
            
            <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-lg border border-gray-100 flex justify-between items-center z-30">
              <div>
                <p className="text-xs text-gray-500 font-medium">AVAILABLE TAXIS</p>
                <p className="font-bold text-sm">4 DRIVERS NEARBY</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        <iframe src="/driver" style={{ display: 'none' }} />
      </main>
    </div>
  );
}
