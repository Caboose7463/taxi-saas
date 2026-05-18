"use client";
import { API_URL } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const STATUSES = ['ACCEPTED','EN_ROUTE','ARRIVED','PASSENGER_ONBOARD','COMPLETED'];
const STATUS_LABELS: Record<string,string> = { ACCEPTED:'Accepted', EN_ROUTE:'En Route to Pickup', ARRIVED:'Arrived at Pickup', PASSENGER_ONBOARD:'Passenger Onboard', COMPLETED:'Complete Job' };

export default function DriverDashboard() {
  const [socket, setSocket] = useState<Socket|null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [incomingBooking, setIncomingBooking] = useState<any>(null);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [earnings, setEarnings] = useState(0);
  const [ridesCompleted, setRidesCompleted] = useState(0);
  const [driverName, setDriverName] = useState('Driver');

  const getToken = () => document.cookie.split(';').find(c=>c.trim().startsWith('token='))?.split('=')[1];

  const [isApproved, setIsApproved] = useState<boolean|null>(null);
  const [cachedPosition, setCachedPosition] = useState<GeolocationPosition|null>(null);

  useEffect(() => {
    try {
      const info = localStorage.getItem('driverInfo');
      if (info) { const d=JSON.parse(info); if(d.name)setDriverName(d.name); }
      const t=getToken();
      if(t){const p=JSON.parse(atob(t.split('.')[1]));if(p.name)setDriverName(p.name);}
    } catch {}

    // Check approval status
    const token = getToken();
    if (token) {
      fetch(`${API_URL}/api/v1/bookings/driver/profile`, {
        headers: { Authorization: `Bearer ${token}`, 'bypass-tunnel-reminder': 'true' }
      }).then(r=>r.ok?r.json():null).then(d=>{
        if(d) { setIsApproved(d.isApproved); if(d.name) setDriverName(d.name); }
        else setIsApproved(false);
      }).catch(()=>setIsApproved(false));
    } else {
      setIsApproved(false);
    }

    // Request location permission immediately on load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setCachedPosition(pos),
        err => console.log('Location denied:', err.message),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    const s = io(API_URL, { transports:['websocket','polling'] });
    setSocket(s);
    s.on('new_booking_request', (data:any) => { if(!activeBooking) setIncomingBooking(data); });
    return () => { s.close(); };
  }, []);

  // Show pending screen if not approved
  if (isApproved === false) return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6" style={{fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif'}}>
      <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Application Pending</h2>
        <p className="text-gray-500 text-sm mb-2">Your application is under review by the admin team.</p>
        <p className="text-gray-400 text-xs mb-8">You will be notified once approved. This usually takes up to 24 hours.</p>
        <a href="/driver/login" className="block text-xs text-gray-400 hover:text-gray-600">Wrong account? Sign in again</a>
      </div>
    </div>
  );

  if (isApproved === null) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"/>
    </div>
  );

  const handleAccept = async () => {
    if (!incomingBooking) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/bookings/${incomingBooking.id}/accept`, {
        method:'PATCH', headers:{'Content-Type':'application/json','bypass-tunnel-reminder':'true',Authorization:`Bearer ${getToken()}`},
        body: JSON.stringify({ driverId:'me' })
      });
      if (res.ok) { setActiveBooking({...incomingBooking, status:'ACCEPTED'}); setIncomingBooking(null); }
      else { alert('Booking already taken'); setIncomingBooking(null); }
    } catch { alert('Network error'); }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!activeBooking) return;
    try {
      await fetch(`${API_URL}/api/v1/bookings/${activeBooking.id}/status`, {
        method:'PATCH', headers:{'Content-Type':'application/json','bypass-tunnel-reminder':'true',Authorization:`Bearer ${getToken()}`},
        body: JSON.stringify({ status: newStatus })
      });
      if (newStatus==='COMPLETED') {
        setEarnings(e=>e+(activeBooking.driverPayout||activeBooking.fare*0.9));
        setRidesCompleted(r=>r+1);
        setActiveBooking(null);
      } else {
        setActiveBooking((b:any)=>({...b,status:newStatus}));
      }
    } catch { alert('Error updating status'); }
  };

  const nextStatus = activeBooking ? STATUSES[STATUSES.indexOf(activeBooking.status)+1] : null;

  return (
    <div className="flex h-screen bg-gray-950 justify-center items-center">
      <div className="relative w-full h-full max-w-sm bg-gray-900 overflow-hidden shadow-2xl sm:rounded-[40px] sm:border-4 sm:border-gray-800 sm:h-[812px]">
        <div className={`absolute inset-0 transition-all duration-700 ${isOnline?'opacity-100':'opacity-20 grayscale'}`}
          style={{background:'linear-gradient(135deg,#1a2332 0%,#162032 40%,#1e2d40 100%)'}}>
          <div className="absolute inset-0" style={{backgroundImage:'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)',backgroundSize:'40px 40px'}}/>
        </div>

        <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-start z-20">
          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl">
            <p className="text-white/60 text-[10px] font-medium">DRIVER</p>
            <p className="text-white text-sm font-bold">{driverName}</p>
          </div>
          {!activeBooking&&(
            <button onClick={()=>setIsOnline(!isOnline)}
              className={`px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2.5 font-bold text-sm transition-all ${isOnline?'bg-green-500 text-white':'bg-white text-gray-900'}`}>
              <div className={`w-2 h-2 rounded-full ${isOnline?'bg-white animate-pulse':'bg-red-500'}`}/>
              {isOnline?'ONLINE':'GO ONLINE'}
            </button>
          )}
          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-right">
            <p className="text-white/60 text-[10px] font-medium">TODAY</p>
            <p className="text-white text-sm font-bold">£{earnings.toFixed(2)}</p>
          </div>
        </div>

        {!isOnline&&!activeBooking&&(
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-white rounded-3xl p-8 mx-6 text-center shadow-2xl">
              <div className="text-5xl mb-4">🚖</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">You are Offline</h2>
              <p className="text-gray-500 text-sm mb-6">Go online to receive bookings from hotels.</p>
              <button onClick={()=>setIsOnline(true)} className="w-full bg-black text-white py-3.5 rounded-2xl font-bold text-sm">Go Online Now</button>
            </div>
          </div>
        )}

        {isOnline&&!activeBooking&&!incomingBooking&&(
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-3 animate-pulse"/>
              <p className="text-white font-bold">Waiting for bookings...</p>
              <p className="text-white/60 text-xs mt-1">{ridesCompleted} rides today · £{earnings.toFixed(2)} earned</p>
            </div>
          </div>
        )}

        {/* Active booking status panel */}
        {activeBooking&&(
          <div className="absolute bottom-0 left-0 right-0 z-30">
            <div className="bg-white rounded-t-[32px] p-6 shadow-2xl">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4"/>
              <div className="flex justify-between items-center mb-4">
                <div><p className="text-xs text-gray-400">ACTIVE JOB</p><p className="font-bold text-lg">{activeBooking.guestName||'Guest'}</p></div>
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">{activeBooking.status?.replace('_',' ')}</span>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-4">
                <div className="flex items-start gap-2"><span className="text-green-500 text-xs mt-1">●</span><div><p className="text-xs text-gray-400">Pickup</p><p className="text-sm font-medium">{activeBooking.pickupAddress}</p></div></div>
                <div className="flex items-start gap-2"><span className="text-red-500 text-xs mt-1">■</span><div><p className="text-xs text-gray-400">Drop-off</p><p className="text-sm font-medium">{activeBooking.dropoffAddress}</p></div></div>
                {activeBooking.notes&&<p className="text-xs text-gray-400 italic">"{activeBooking.notes}"</p>}
              </div>
              <div className="flex justify-between items-center mb-4 px-1">
                <div><p className="text-xs text-gray-400">YOUR PAYOUT (90%)</p><p className="text-3xl font-black">£{(activeBooking.driverPayout||activeBooking.fare*0.9).toFixed(2)}</p></div>
                <div className="text-right"><p className="text-xs text-gray-400">Total fare</p><p className="text-lg font-bold text-gray-500">£{activeBooking.fare?.toFixed(2)}</p></div>
              </div>
              {nextStatus&&(
                <button onClick={()=>handleStatusUpdate(nextStatus)}
                  className="w-full h-13 py-4 bg-black text-white rounded-2xl font-bold text-sm mb-2">
                  {STATUS_LABELS[nextStatus]||nextStatus}
                </button>
              )}
              {activeBooking.status==='COMPLETED'&&<p className="text-center text-green-600 font-bold">Job Complete! ✅</p>}
            </div>
          </div>
        )}

        {/* Incoming booking request */}
        <div className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-500 ${incomingBooking?'translate-y-0':'translate-y-full'}`}>
          <div className="bg-white rounded-t-[32px] p-6 shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4"/>
            <div className="flex justify-between items-center mb-4">
              <p className="font-bold text-lg">New Booking!</p>
              <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold animate-pulse">⏱ Accept quickly</span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-4">
              {incomingBooking?.guestName&&<p className="text-sm font-medium text-gray-700">👤 {incomingBooking.guestName}</p>}
              <div className="flex items-start gap-2"><span className="text-green-500 text-xs mt-1">●</span><p className="text-sm">{incomingBooking?.pickupAddress}</p></div>
              <div className="flex items-start gap-2"><span className="text-red-500 text-xs mt-1">■</span><p className="text-sm">{incomingBooking?.dropoffAddress}</p></div>
              {incomingBooking?.notes&&<p className="text-xs text-gray-400 italic">"{incomingBooking.notes}"</p>}
            </div>
            <div className="flex justify-between items-center mb-5 px-1">
              <div><p className="text-xs text-gray-400">YOUR PAYOUT (90%)</p><p className="text-3xl font-black">£{incomingBooking?(incomingBooking.driverPayout||incomingBooking.fare*0.9).toFixed(2):'0.00'}</p></div>
            </div>
            <button onClick={handleAccept} className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm mb-2">✓ Accept Booking</button>
            <button onClick={()=>setIncomingBooking(null)} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600">Decline</button>
          </div>
        </div>
      </div>
    </div>
  );
}
