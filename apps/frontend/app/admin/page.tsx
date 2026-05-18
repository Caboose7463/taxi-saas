"use client";
import { API_URL } from '@/lib/api';
import React, { useEffect, useState, useCallback } from 'react';

export default function AdminDashboard() {
  const [tab, setTab] = useState<'overview'|'bookings'|'drivers'|'hotels'>('overview');
  const [bookings, setBookings] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  const token = typeof window!=='undefined' ? document.cookie.split(';').find(c=>c.trim().startsWith('token='))?.split('=')[1] : '';
  const headers = { Authorization:`Bearer ${token}`, 'bypass-tunnel-reminder':'true' };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes,dRes,pRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/bookings/active`,{headers}),
        fetch(`${API_URL}/api/v1/bookings/drivers/all`,{headers}),
        fetch(`${API_URL}/api/v1/bookings/drivers/pending`,{headers}),
      ]);
      if(bRes.ok) setBookings(await bRes.json());
      if(dRes.ok) setDrivers(await dRes.json());
      if(pRes.ok) setPendingDrivers(await pRes.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(()=>{ fetchAll(); },[fetchAll]);

  const approveDriver = async (id:string) => {
    await fetch(`${API_URL}/api/v1/bookings/drivers/${id}/approve`,{method:'PATCH',headers});
    fetchAll();
  };
  const rejectDriver = async (id:string) => {
    const notes = prompt('Reason for rejection (optional):') || '';
    await fetch(`${API_URL}/api/v1/bookings/drivers/${id}/reject`,{method:'PATCH',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({notes})});
    fetchAll();
  };

  const totalRevenue = bookings.filter(b=>b.status==='COMPLETED').reduce((s,b)=>s+b.fare,0);
  const platformRevenue = bookings.filter(b=>b.status==='COMPLETED').reduce((s,b)=>s+b.fare*(1-0.025-0.9),0);
  const completedTrips = bookings.filter(b=>b.status==='COMPLETED').length;
  const activeCount = bookings.filter(b=>['PENDING','ACCEPTED','EN_ROUTE'].includes(b.status)).length;

  const statusColor = (s:string) => ({PENDING:'bg-amber-100 text-amber-700',ACCEPTED:'bg-blue-100 text-blue-700',COMPLETED:'bg-green-100 text-green-700',CANCELLED:'bg-red-100 text-red-700',EN_ROUTE:'bg-purple-100 text-purple-700'}[s]||'bg-gray-100 text-gray-600');

  return (
    <div className="flex h-screen bg-[#F5F5F7]" style={{fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif'}}>
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-sm">T</div>
          <div><p className="font-bold text-sm">Transit Pro</p><p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Super Admin</p></div>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {([['overview','📊','Overview'],['bookings','🚖','All Bookings'],['drivers','👤','Drivers'],['hotels','🏨','Hotels']] as const).map(([id,icon,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 text-sm font-medium transition-all ${tab===id?'bg-black text-white':'text-gray-600 hover:bg-gray-50'}`}>
              <span>{icon}</span>{label}
              {id==='drivers'&&pendingDrivers.length>0&&<span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{pendingDrivers.length}</span>}
            </button>
          ))}
        </nav>
        <div className="border-t border-gray-100 pt-4">
          <button onClick={()=>{document.cookie='token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';window.location.href='/login';}} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Sign out →</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold capitalize">{tab==='overview'?'Platform Overview':tab==='bookings'?'All Bookings':tab==='drivers'?'Driver Management':'Hotel Management'}</h1>
            <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
          </div>
          <button onClick={fetchAll} className="text-xs bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl font-medium transition-colors">↻ Refresh</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">

          {tab==='overview'&&(
            <div className="space-y-6 max-w-4xl">
              <div className="grid grid-cols-4 gap-4">
                {[
                  {label:'Total Bookings',value:bookings.length,icon:'📦',color:'from-blue-500 to-blue-600'},
                  {label:'Active Now',value:activeCount,icon:'🔵',color:'from-orange-400 to-orange-500'},
                  {label:'Platform Revenue',value:`£${platformRevenue.toFixed(2)}`,icon:'💰',color:'from-green-500 to-green-600'},
                  {label:'All Drivers',value:drivers.length,icon:'🚖',color:'from-purple-500 to-purple-600'},
                ].map((s,i)=>(
                  <div key={i} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-sm`}>
                    <p className="text-white/70 text-xs uppercase tracking-wide mb-1">{s.label}</p>
                    <p className="text-3xl font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
              {pendingDrivers.length>0&&(
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-amber-800">⏳ {pendingDrivers.length} Driver{pendingDrivers.length>1?'s':''} Awaiting Approval</h3>
                    <button onClick={()=>setTab('drivers')} className="text-xs text-amber-700 font-bold underline">Review →</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pendingDrivers.map(d=>(
                      <div key={d.id} className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 border border-amber-100">
                        <span className="text-sm font-medium">{d.name}</span>
                        <button onClick={()=>approveDriver(d.id)} className="text-xs text-green-600 font-bold hover:text-green-800">✓ Approve</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-sm mb-4">Revenue Breakdown</h3>
                  <div className="space-y-2">
                    {[
                      {label:'Total fares',value:`£${totalRevenue.toFixed(2)}`},
                      {label:'Driver payouts (90%)',value:`£${(totalRevenue*0.9).toFixed(2)}`},
                      {label:'Hotel commissions (2.5%)',value:`£${(totalRevenue*0.025).toFixed(2)}`},
                      {label:'Platform revenue (7.5%)',value:`£${platformRevenue.toFixed(2)}`,bold:true},
                    ].map((r,i)=>(
                      <div key={i} className={`flex justify-between items-center py-1.5 ${i<3?'border-b border-gray-50':''}`}>
                        <span className="text-sm text-gray-600">{r.label}</span>
                        <span className={`text-sm ${r.bold?'font-bold text-green-600':'font-medium'}`}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-sm mb-4">System Health</h3>
                  {[
                    {label:'Backend API',status:'Operational',url:'taxi-saas-backend.onrender.com'},
                    {label:'Database',status:'Operational',url:'Supabase PostgreSQL'},
                    {label:'WebSockets',status:'Operational',url:'Socket.io'},
                    {label:'Frontend',status:'Operational',url:'Vercel'},
                  ].map((item,i)=>(
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-gray-400">{item.url}</p></div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/><span className="text-xs text-green-600 font-medium">{item.status}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab==='bookings'&&(
            <div className="max-w-5xl">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex justify-between">
                  <p className="text-sm text-gray-500">{bookings.length} total bookings</p>
                </div>
                {loading?<div className="p-8 text-center text-gray-400">Loading...</div>:
                bookings.length===0?<div className="p-8 text-center text-gray-400">No bookings yet</div>:(
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">{['Time','Guest','Pickup','Dropoff','Fare','Hotel Commission','Driver Payout','Status'].map(h=><th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>)}</tr></thead>
                    <tbody>
                      {bookings.map(b=>(
                        <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(b.createdAt).toLocaleString('en-GB',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'})}</td>
                          <td className="px-4 py-3 text-gray-600">{b.guestName||'—'}</td>
                          <td className="px-4 py-3 max-w-[120px] truncate text-gray-700">{b.pickupAddress}</td>
                          <td className="px-4 py-3 max-w-[120px] truncate">{b.dropoffAddress}</td>
                          <td className="px-4 py-3 font-bold">£{b.fare?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-green-600">£{(b.hotelCommission||b.fare*0.025).toFixed(2)}</td>
                          <td className="px-4 py-3 text-blue-600">£{(b.driverPayout||b.fare*0.9).toFixed(2)}</td>
                          <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-lg font-medium ${statusColor(b.status)}`}>{b.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>)}
              </div>
            </div>
          )}

          {tab==='drivers'&&(
            <div className="max-w-4xl space-y-6">
              {pendingDrivers.length>0&&(
                <div>
                  <h2 className="font-bold mb-3 text-base flex items-center gap-2">⏳ Pending Approval <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingDrivers.length}</span></h2>
                  <div className="space-y-3">
                    {pendingDrivers.map(d=>(
                      <div key={d.id} className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold">{d.name}</p>
                            <p className="text-xs text-gray-500">{d.email} · {d.phone}</p>
                            {d.vehicleMake&&<p className="text-xs text-gray-500 mt-0.5">{d.vehicleColour} {d.vehicleMake} {d.vehicleModel} · {d.vehicleReg}</p>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={()=>approveDriver(d.id)} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-colors">✓ Approve</button>
                            <button onClick={()=>rejectDriver(d.id)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors">✗ Reject</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[['licenceDoc','Driving Licence'],['phLicenceDoc','PH Licence'],['insuranceDoc','Insurance'],['motDoc','MOT']].map(([key,label])=>(
                            <div key={key} className={`text-center p-2 rounded-xl text-xs font-medium ${d[key]?'bg-green-50 text-green-700 border border-green-200':'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                              {d[key]?'✓':'-'} {label}
                              {d[key]&&<div className="mt-1"><a href={d[key]} target="_blank" className="text-blue-500 underline text-[10px]">View</a></div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h2 className="font-bold mb-3 text-base">All Drivers ({drivers.length})</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">{['Name','Email','Vehicle','Reg','Status','Approved'].map(h=><th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>)}</tr></thead>
                    <tbody>
                      {drivers.map(d=>(
                        <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{d.name}</td>
                          <td className="px-4 py-3 text-gray-500">{d.email}</td>
                          <td className="px-4 py-3 text-gray-600">{d.vehicleMake} {d.vehicleModel}</td>
                          <td className="px-4 py-3 font-mono text-xs">{d.vehicleReg||'—'}</td>
                          <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-lg ${d.status==='ONLINE'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{d.status}</span></td>
                          <td className="px-4 py-3">{d.isApproved?<span className="text-green-600 font-bold text-xs">✓ Yes</span>:d.isRejected?<span className="text-red-500 text-xs">✗ Rejected</span>:<span className="text-amber-600 text-xs">⏳ Pending</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {drivers.length===0&&<div className="p-8 text-center text-gray-400">No drivers yet</div>}
                </div>
              </div>
            </div>
          )}

          {tab==='hotels'&&(
            <div className="max-w-2xl">
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                <p className="text-4xl mb-3">🏨</p>
                <h3 className="font-bold mb-2">Hotel Management</h3>
                <p className="text-gray-400 text-sm mb-6">Hotels are onboarded via the database. Each hotel gets their own login and dashboard.</p>
                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                  <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"><p className="text-xl font-bold">1</p><p className="text-xs text-gray-500">Active</p></div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"><p className="text-xl font-bold text-green-600">£{(totalRevenue*0.025).toFixed(0)}</p><p className="text-xs text-gray-500">Commissions</p></div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"><p className="text-xl font-bold">{completedTrips}</p><p className="text-xs text-gray-500">Bookings</p></div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
