"use client";
import { API_URL } from '@/lib/api';
import React, { useEffect, useState } from 'react';

const STATUS_COLOR: Record<string,string> = {
  PENDING:'bg-amber-100 text-amber-700',
  ACCEPTED:'bg-blue-100 text-blue-700',
  EN_ROUTE:'bg-purple-100 text-purple-700',
  ARRIVED:'bg-indigo-100 text-indigo-700',
  PASSENGER_ONBOARD:'bg-cyan-100 text-cyan-700',
  COMPLETED:'bg-green-100 text-green-700',
  CANCELLED:'bg-red-100 text-red-700',
};

export default function DriverDiary() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'upcoming'|'completed'>('all');
  const [earnings, setEarnings] = useState(0);
  const [driverName, setDriverName] = useState('Driver');

  useEffect(() => {
    try {
      const info = localStorage.getItem('driverInfo');
      if (info) { const d = JSON.parse(info); if(d.name) setDriverName(d.name); }
    } catch {}

    const token = document.cookie.split(';').find(c=>c.trim().startsWith('token='))?.split('=')[1];
    fetch(`${API_URL}/api/v1/bookings/driver/diary`, {
      headers:{ Authorization:`Bearer ${token}`, 'bypass-tunnel-reminder':'true' }
    }).then(r=>r.ok?r.json():[]).then(data=>{
      setBookings(data);
      const earned = data.filter((b:any)=>b.status==='COMPLETED').reduce((s:number,b:any)=>s+(b.driverPayout||b.fare*0.9),0);
      setEarnings(earned);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  const filtered = bookings.filter(b => {
    if (filter==='upcoming') return ['PENDING','ACCEPTED','EN_ROUTE','ARRIVED','PASSENGER_ONBOARD'].includes(b.status);
    if (filter==='completed') return b.status==='COMPLETED';
    return true;
  });

  const completedCount = bookings.filter(b=>b.status==='COMPLETED').length;
  const acceptanceRate = bookings.length > 0 ? Math.round((completedCount/bookings.length)*100) : 0;

  return (
    <div className="min-h-screen bg-[#F5F5F7]" style={{fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif'}}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <a href="/driver/dashboard" className="text-gray-400 hover:text-black transition-colors text-sm">← Dashboard</a>
          <span className="text-gray-200">|</span>
          <h1 className="font-bold text-base">My Diary</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">{driverName[0]}</div>
          <span className="text-sm font-medium text-gray-700">{driverName}</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {label:'Total Earned',value:`£${earnings.toFixed(2)}`,icon:'💰',color:'text-green-600'},
            {label:'Completed',value:completedCount,icon:'✅',color:'text-blue-600'},
            {label:'Completion Rate',value:`${acceptanceRate}%`,icon:'📈',color:'text-purple-600'},
          ].map((s,i)=>(
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm">
          {([['all','All Jobs'],['upcoming','Active'],['completed','Completed']] as const).map(([id,label])=>(
            <button key={id} onClick={()=>setFilter(id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${filter===id?'bg-black text-white':'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <p className="text-3xl mb-3">📋</p>
            <p className="font-medium text-gray-700">No jobs found</p>
            <p className="text-xs text-gray-400 mt-1">Go online to start accepting bookings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(b=>(
              <div key={b.id} className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${b.status==='COMPLETED'?'border-gray-100 opacity-80':'border-gray-200'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${STATUS_COLOR[b.status]||'bg-gray-100 text-gray-600'}`}>{b.status?.replace('_',' ')}</span>
                    {b.guestName && <span className="ml-2 text-xs text-gray-500">👤 {b.guestName}</span>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">£{(b.driverPayout||b.fare*0.9).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">90% payout</p>
                  </div>
                </div>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 text-xs mt-0.5 flex-shrink-0">●</span>
                    <p className="text-sm text-gray-700">{b.pickupAddress}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 text-xs mt-0.5 flex-shrink-0">■</span>
                    <p className="text-sm text-gray-700">{b.dropoffAddress}</p>
                  </div>
                  {b.notes && <p className="text-xs text-gray-400 italic ml-4">"{b.notes}"</p>}
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                  <p className="text-xs text-gray-400">{b.hotel?.name||'Hotel'}</p>
                  <p className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
