"use client";
import { API_URL } from '@/lib/api';
import React, { useEffect, useState } from 'react';

export default function HotelStaff({ params }: { params: { subdomain: string } }) {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [error, setError] = useState('');

  const getToken = () => document.cookie.split(';').find(c=>c.trim().startsWith('token='))?.split('=')[1];
  const headers = () => ({ Authorization:`Bearer ${getToken()}`, 'bypass-tunnel-reminder':'true' });

  const fetchStaff = () => {
    setLoading(true);
    fetch(`${API_URL}/api/v1/bookings/hotel/staff`, { headers:headers() })
      .then(r=>r.ok?r.json():[]).then(d=>{ setStaff(d); setLoading(false); })
      .catch(()=>setLoading(false));
  };

  useEffect(()=>{ fetchStaff(); },[]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setAdding(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/bookings/hotel/staff`, {
        method:'POST',
        headers:{'Content-Type':'application/json',...headers()},
        body:JSON.stringify(form)
      });
      if (res.ok) { setForm({name:'',email:'',password:''}); setShowForm(false); fetchStaff(); }
      else { const e=await res.json(); setError(e.message||'Failed to add staff'); }
    } catch { setError('Network error'); }
    setAdding(false);
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from your team?`)) return;
    await fetch(`${API_URL}/api/v1/bookings/hotel/staff/${id}`, { method:'DELETE', headers:headers() });
    fetchStaff();
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-8" style={{fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif'}}>
      <div className="max-w-2xl mx-auto">
        <a href={`/hotel/${params.subdomain}`} className="text-gray-400 hover:text-black text-sm block mb-6">← Back to Dashboard</a>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Staff Management</h1>
            <p className="text-gray-400 text-sm">Manage who can access your hotel dashboard.</p>
          </div>
          <button onClick={()=>setShowForm(!showForm)} className="bg-black text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">
            + Add Staff
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-5">
            <h2 className="font-bold text-sm mb-4">Add New Staff Member</h2>
            {error && <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">{error}</div>}
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Name</label>
                  <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10" placeholder="Jane Smith"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10" placeholder="jane@hotel.com"/>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Temporary Password</label>
                <input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required minLength={8}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10" placeholder="Min 8 characters"/>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>{setShowForm(false);setError('');}} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={adding} className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-bold disabled:opacity-50">{adding?'Adding...':'Add Staff Member'}</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <p className="text-sm text-gray-500">{staff.length} staff member{staff.length!==1?'s':''}</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-black border-t-transparent rounded-full animate-spin"/></div>
          ) : staff.length === 0 ? (
            <div className="text-center py-12"><p className="text-3xl mb-3">👤</p><p className="text-gray-500 font-medium">No staff yet</p><p className="text-xs text-gray-400 mt-1">Add your team members above</p></div>
          ) : (
            staff.map((s,i)=>(
              <div key={s.id} className={`flex items-center gap-4 px-6 py-4 ${i<staff.length-1?'border-b border-gray-50':''} hover:bg-gray-50 transition-colors`}>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {s.name?.[0]?.toUpperCase()||'?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                  <p className="text-xs text-gray-400 truncate">{s.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-medium">Active</span>
                  <button onClick={()=>handleRemove(s.id,s.name)} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors ml-1">Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs text-blue-700 font-semibold mb-1">ℹ️ Staff Access</p>
          <p className="text-xs text-blue-600">All staff members have full access to your hotel dashboard — booking, history, analytics and settings. Share their login credentials directly with them.</p>
        </div>
      </div>
    </div>
  );
}
