"use client";
import { API_URL } from '@/lib/api';
import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { io } from 'socket.io-client';
import dynamic from 'next/dynamic';
import LocationInput from '@/components/LocationInput';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false, loading: () => <div className="flex-1 min-h-64 bg-slate-100 rounded-2xl flex items-center justify-center"><div className="text-gray-400 text-sm">Loading map...</div></div> });

interface Booking {
  id: string; pickupAddress: string; dropoffAddress: string;
  fare: number; status: string; createdAt: string;
  guestName?: string; guestPhone?: string; notes?: string;
  driverPayout?: number; hotelCommission?: number;
}

export default function HotelDashboard({ params }: { params: { subdomain: string } }) {
  const [activeTab, setActiveTab] = useState<'book'|'active'|'history'|'analytics'>('book');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [driverPos, setDriverPos] = useState({ x: 35, y: 55 });
  const [driver2Pos, setDriver2Pos] = useState({ x: 65, y: 40 });
  const [estimate, setEstimate] = useState<any>(null);
  const [pickupCoords, setPickupCoords] = useState<{lat:number;lng:number}|null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{lat:number;lng:number}|null>(null);
  const [estimating, setEstimating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [staffInfo, setStaffInfo] = useState({ name: 'Reception', hotel: 'Hotel' });

  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket','polling'] });

    // Always fetch fresh hotel profile from API so name/address are current
    const token = document.cookie.split(';').find(c=>c.trim().startsWith('token='))?.split('=')[1];
    if (token) {
      fetch(`${API_URL}/api/v1/bookings/hotel/profile`, {
        headers: { Authorization: `Bearer ${token}`, 'bypass-tunnel-reminder': 'true' }
      }).then(r=>r.ok?r.json():null).then(hotel => {
        if (hotel) {
          setStaffInfo(s => ({ ...s, hotel: hotel.name }));
          if (hotel.address) setPickup(hotel.address);
          // Update localStorage with fresh data
          try { const saved = localStorage.getItem('staffInfo'); if(saved){ const info=JSON.parse(saved); info.hotel=hotel.name; info.hotelAddress=hotel.address; localStorage.setItem('staffInfo',JSON.stringify(info)); } } catch {}
        }
      }).catch(()=>{});
    }
    try {
      const saved = localStorage.getItem('staffInfo');
      if (saved) { const info = JSON.parse(saved); setStaffInfo(info); if (info.hotelAddress) setPickup(info.hotelAddress); }
    } catch {}
    return () => { socket.close();  };
  }, []);

  const getToken = () => document.cookie.split(';').find(c=>c.trim().startsWith('token='))?.split('=')[1];

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/bookings/hotel`, { headers: { Authorization: `Bearer ${getToken()}`, 'bypass-tunnel-reminder':'true' } });
      if (res.ok) setBookings(await res.json());
    } catch {}
    setBookingsLoading(false);
  }, []);

  useEffect(() => { if (activeTab !== 'book') fetchBookings(); }, [activeTab, fetchBookings]);

  const handleEstimate = async () => {
    if (!pickup || !dropoff) return;
    setEstimating(true); setEstimate(null);
    try {
      const r = await fetch(`${API_URL}/api/v1/bookings/estimate`, { method:'POST', headers:{'Content-Type':'application/json','bypass-tunnel-reminder':'true'}, body: JSON.stringify({pickup,dropoff}) });
      setEstimate(await r.json());
    } catch { setEstimate({ fare: 15.50, hotelCommission: 0.39, driverPayout: 13.95, distance: '~5 miles (estimate)' }); }
    setEstimating(false);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;
    setLoading(true);
    try {
      let est = estimate;
      if (!est) {
        const r = await fetch(`${API_URL}/api/v1/bookings/estimate`, { method:'POST', headers:{'Content-Type':'application/json','bypass-tunnel-reminder':'true'}, body:JSON.stringify({pickup,dropoff}) });
        est = await r.json();
      }
      const res = await fetch(`${API_URL}/api/v1/bookings`, {
        method:'POST',
        headers:{'Content-Type':'application/json','bypass-tunnel-reminder':'true',Authorization:`Bearer ${getToken()}`},
        body: JSON.stringify({ pickupAddress:pickup, dropoffAddress:dropoff, fare:est.fare, hotelCommission:est.hotelCommission, driverPayout:est.driverPayout, guestName, guestPhone, notes, scheduledFor: isScheduled ? scheduledFor : undefined })
      });
      if (res.ok) {
        setSuccessMsg(isScheduled ? ` Scheduled for ${new Date(scheduledFor).toLocaleString('en-GB')}` : ' Booking confirmed! Dispatched to nearby drivers.');
        setDropoff(''); setGuestName(''); setGuestPhone(''); setNotes(''); setEstimate(null); setScheduledFor('');
        setTimeout(() => setSuccessMsg(''), 6000);
        fetchBookings();
      } else {
        const err = await res.json().catch(()=>({}));
        alert('Booking failed: '+(err.message||res.status));
      }
    } catch { alert('Network error — please try again'); }
    setLoading(false);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/bookings/${id}/cancel`, { method:'PATCH', headers:{Authorization:`Bearer ${getToken()}`,'bypass-tunnel-reminder':'true'} });
      if (res.ok) fetchBookings();
    } catch {}
  };

  const statusColor = (s:string) => ({PENDING:'bg-amber-100 text-amber-700',ACCEPTED:'bg-blue-100 text-blue-700',COMPLETED:'bg-green-100 text-green-700',CANCELLED:'bg-red-100 text-red-700',EN_ROUTE:'bg-purple-100 text-purple-700'}[s]||'bg-gray-100 text-gray-600');

  const activeBookings = bookings.filter(b=>['PENDING','ACCEPTED','EN_ROUTE'].includes(b.status));
  const historyBookings = bookings.filter(b=>['COMPLETED','CANCELLED'].includes(b.status));
  const totalCommission = bookings.filter(b=>b.status==='COMPLETED').reduce((s,b)=>s+(b.hotelCommission||b.fare*0.025),0);
  const totalTrips = bookings.filter(b=>b.status==='COMPLETED').length;

  return (
    <div className="flex h-screen bg-[#F5F5F7]" style={{fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif'}}>
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-sm">T</div>
          <span className="font-bold text-sm text-gray-900">TRANSIT PRO</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {([['book','Book a Taxi'],['active','Active Bookings'],['history','History'],['analytics','Analytics']] as const).map(([id,label])=>(
            <button key={id} onClick={()=>setActiveTab(id)}
              className={`px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 text-sm font-medium transition-all ${activeTab===id?'bg-black text-white':'text-gray-600 hover:bg-gray-50'}`}>
              {label}
              {id==='active'&&activeBookings.length>0&&<span className="ml-auto bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeBookings.length}</span>}
            </button>
          ))}
        </nav>
        <div className="border-t border-gray-100 pt-4">
          <a href={`/hotel/${params.subdomain}/settings`} className="block px-3 py-2 text-xs text-gray-500 hover:text-black rounded-xl hover:bg-gray-50 transition-colors mb-1 font-medium">️ Hotel Settings</a>
          <a href={`/hotel/${params.subdomain}/staff`} className="block px-3 py-2 text-xs text-gray-500 hover:text-black rounded-xl hover:bg-gray-50 transition-colors mb-2 font-medium"> Manage Staff</a>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{staffInfo.name[0]}</div>
            <div><p className="text-xs font-semibold text-gray-900">{staffInfo.name}</p><p className="text-[10px] text-gray-400">{staffInfo.hotel}</p></div>
          </div>
          <button onClick={()=>{document.cookie='token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';localStorage.removeItem('staffInfo');window.location.href='/login';}}
            className="w-full text-xs text-gray-400 hover:text-red-500 text-left transition-colors">Sign out </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{activeTab==='book'?'Book a Taxi':activeTab==='active'?'Active Bookings':activeTab==='history'?'Booking History':'Analytics'}</h1>
            <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2 text-center">
              <p className="text-[10px] text-green-600 font-bold uppercase">Commission Earned</p>
              <p className="text-lg font-bold text-green-700">£{totalCommission.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-center">
              <p className="text-[10px] text-blue-600 font-bold uppercase">Completed Trips</p>
              <p className="text-lg font-bold text-blue-700">{totalTrips}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab==='book'&&(
            <div className="flex gap-6 max-w-5xl">
              <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-bold mb-1">New Booking</h2>
                <p className="text-xs text-gray-400 mb-5">Book a taxi for your guest instantly or schedule ahead.</p>
                {successMsg&&<div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-medium">{successMsg}</div>}
                <form onSubmit={handleBook} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Guest Name</label>
                      <input value={guestName} onChange={e=>setGuestName(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10" placeholder="John Smith"/>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Guest Phone</label>
                      <input value={guestPhone} onChange={e=>setGuestPhone(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10" placeholder="+44..."/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Pickup Location</label>
                    <LocationInput value={pickup} onChange={v=>{setPickup(v);setEstimate(null);}} onSelect={(v,lat,lng)=>{setPickup(v);setPickupCoords({lat,lng});setEstimate(null);}} placeholder="Pickup address..." dot="green" required/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Drop-off Location</label>
                    <LocationInput value={dropoff} onChange={v=>{setDropoff(v);setEstimate(null);}} onSelect={(v,lat,lng)=>{setDropoff(v);setDropoffCoords({lat,lng});setEstimate(null);}} placeholder="Start typing destination..." dot="red" required/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Notes</label>
                    <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 resize-none" placeholder="Luggage, wheelchair, flight number..."/>
                  </div>
                  <div className="flex items-center gap-3 py-2 border-t border-gray-100">
                    <button type="button" onClick={()=>setIsScheduled(!isScheduled)} className={`relative w-10 h-5 rounded-full transition-colors ${isScheduled?'bg-black':'bg-gray-200'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isScheduled?'translate-x-5':'translate-x-0.5'}`}/>
                    </button>
                    <span className="text-sm font-medium text-gray-700">Schedule for later</span>
                  </div>
                  {isScheduled&&<input type="datetime-local" value={scheduledFor} onChange={e=>setScheduledFor(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10" required={isScheduled}/>}
                  {estimate?(
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <div><p className="text-xs text-gray-500">Estimated Fare</p><p className="text-2xl font-bold text-gray-900">£{estimate.fare?.toFixed(2)}</p><p className="text-xs text-gray-400">{estimate.distance} · ETA ~{estimate.etaMinutes||8} min · Hotel earns £{estimate.hotelCommission?.toFixed(2)}</p></div>
                        <div><p className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">£3.50 + £2.50/mi</p></div>
                      </div>
                    </div>
                  ):(
                    <button type="button" onClick={handleEstimate} disabled={!dropoff||estimating} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all disabled:opacity-40">
                      {estimating?'Calculating...':' Get price estimate first'}
                    </button>
                  )}
                  <button type="submit" disabled={loading||!dropoff} className="w-full py-3.5 bg-black text-white rounded-xl font-bold text-sm shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50">
                    {loading?'Dispatching...':(isScheduled?'Schedule Booking':'Confirm & Dispatch Now')}
                  </button>
                </form>
              </div>
              <div className="w-80 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                  <p className="text-xs font-bold text-gray-700">LIVE DRIVER MAP</p>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/><span className="text-xs text-green-600 font-medium">Live</span></div>
                </div>
                <div className="relative flex-1 min-h-64 bg-slate-100">
                  <div className="absolute inset-0" style={{backgroundImage:'linear-gradient(rgba(0,0,0,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.04) 1px,transparent 1px)',backgroundSize:'30px 30px'}}/>
                  <div className="absolute inset-0"><div className="absolute bg-white h-1.5 w-full opacity-90" style={{top:'40%'}}/><div className="absolute bg-white w-1.5 h-full opacity-90" style={{left:'35%'}}/><div className="absolute bg-white h-1 w-full opacity-70" style={{top:'70%'}}/><div className="absolute bg-white w-1 h-full opacity-70" style={{left:'65%'}}/></div>
                  <div className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2" style={{left:'50%',top:'50%'}}><div className="w-9 h-9 bg-black rounded-full text-white flex items-center justify-center font-bold text-sm border-2 border-white shadow-lg">H</div></div>
                  {[{pos:driverPos,color:'bg-blue-500',n:1},{pos:driver2Pos,color:'bg-purple-500',n:2},{pos:{x:75,y:25},color:'bg-orange-500',n:3},{pos:{x:20,y:80},color:'bg-teal-500',n:4}].map(({pos,color,n})=>(
                    <div key={n} className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-[2000ms]" style={{left:`${pos.x}%`,top:`${pos.y}%`}}>
                      <div className={`w-7 h-7 ${color} rounded-full text-white flex items-center justify-center text-xs font-bold shadow-md border-2 border-white`}>{n}</div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-50"><p className="text-xs text-gray-400 text-center">Nearest driver ~3 mins away</p></div>
              </div>
            </div>
          )}

          {activeTab==='active'&&(
            <div className="max-w-3xl space-y-3">
              <div className="flex justify-between items-center mb-2"><p className="text-sm text-gray-500">{activeBookings.length} active</p><button onClick={fetchBookings} className="text-xs text-blue-500 hover:text-blue-700">↻ Refresh</button></div>
              {bookingsLoading?<div className="text-center py-16 text-gray-400 text-sm">Loading...</div>:
              activeBookings.length===0?<div className="text-center py-16"><p className="text-4xl mb-3"></p><p className="text-gray-500 font-medium">No active bookings</p><button onClick={()=>setActiveTab('book')} className="mt-4 px-4 py-2 bg-black text-white text-sm rounded-xl font-medium">Book Now </button></div>:
              activeBookings.map(b=>(
                <div key={b.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div><span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${statusColor(b.status)}`}>{b.status}</span>{b.guestName&&<span className="ml-2 text-xs text-gray-500">Guest: {b.guestName}</span>}</div>
                    <span className="text-lg font-bold">£{b.fare?.toFixed(2)}</span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-sm"><span className="text-green-500 font-bold">●</span><span className="text-gray-700">{b.pickupAddress}</span></div>
                    <div className="flex items-center gap-2 text-sm"><span className="text-red-500 font-bold">■</span><span className="text-gray-700">{b.dropoffAddress}</span></div>
                    {b.notes&&<p className="text-xs text-gray-400 italic ml-4">"{b.notes}"</p>}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleTimeString('en-GB')} · Your commission: £{(b.hotelCommission||b.fare*0.025).toFixed(2)}</p>
                    {['PENDING','ACCEPTED'].includes(b.status)&&<button onClick={()=>handleCancel(b.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Cancel</button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab==='history'&&(
            <div className="max-w-3xl space-y-3">
              <div className="flex justify-between items-center mb-2"><p className="text-sm text-gray-500">{historyBookings.length} trips</p><button onClick={fetchBookings} className="text-xs text-blue-500 hover:text-blue-700">↻ Refresh</button></div>
              {bookingsLoading?<div className="text-center py-16 text-gray-400 text-sm">Loading...</div>:
              historyBookings.length===0?<div className="text-center py-16"><p className="text-4xl mb-3"></p><p className="text-gray-500">No history yet</p></div>:
              historyBookings.map(b=>(
                <div key={b.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm opacity-85">
                  <div className="flex justify-between items-start mb-3">
                    <div><span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${statusColor(b.status)}`}>{b.status}</span>{b.guestName&&<span className="ml-2 text-xs text-gray-500">{b.guestName}</span>}</div>
                    <span className="text-lg font-bold">£{b.fare?.toFixed(2)}</span>
                  </div>
                  <div className="space-y-1.5 mb-2">
                    <div className="flex items-center gap-2 text-sm"><span className="text-green-500">●</span><span className="text-gray-700">{b.pickupAddress}</span></div>
                    <div className="flex items-center gap-2 text-sm"><span className="text-red-500">■</span><span className="text-gray-700">{b.dropoffAddress}</span></div>
                  </div>
                  <p className="text-xs text-gray-400 pt-2 border-t border-gray-50">{new Date(b.createdAt).toLocaleString('en-GB')} · Hotel earned: £{(b.hotelCommission||b.fare*0.025).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab==='analytics'&&(
            <div className="max-w-3xl space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[{label:'Total Bookings',value:bookings.length,icon:'',color:'blue'},{label:'Completed',value:totalTrips,icon:'',color:'green'},{label:'Commission Earned',value:`£${totalCommission.toFixed(2)}`,icon:'',color:'purple'}].map((s,i)=>(
                  <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                    <p className="text-2xl mb-2">{s.icon}</p>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold mb-4 text-sm">Commission Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Hotel commission rate</span><span className="font-bold">2.5% per booking</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Driver payout rate</span><span className="font-bold">90% of fare</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Platform fee</span><span className="font-bold">7.5% of fare</span></div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold"><span>Total commission earned</span><span className="text-green-600">£{totalCommission.toFixed(2)}</span></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold mb-4 text-sm">Recent Trips</h3>
                {bookings.slice(0,8).map(b=>(
                  <div key={b.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div><p className="text-sm font-medium">{b.dropoffAddress}</p><p className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleDateString('en-GB')}</p></div>
                    <div className="text-right"><p className="text-sm font-bold">£{b.fare?.toFixed(2)}</p><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(b.status)}`}>{b.status}</span></div>
                  </div>
                ))}
                {bookings.length===0&&<p className="text-gray-400 text-sm text-center py-4">No bookings yet</p>}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
