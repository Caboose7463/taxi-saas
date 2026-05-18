"use client";
import { API_URL } from '@/lib/api';
import React, { useEffect, useState } from 'react';

export default function HotelSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ brand_color:'#000000', logo_url:'', welcome_text:'', address:'' });
  const [saved, setSaved] = useState(false);

  const getToken = () => document.cookie.split(';').find(c=>c.trim().startsWith('token='))?.split('=')[1];

  useEffect(() => {
    fetch(`${API_URL}/api/v1/bookings/hotel/profile`, {
      headers:{Authorization:`Bearer ${getToken()}`,'bypass-tunnel-reminder':'true'}
    }).then(r=>r.ok?r.json():null).then(d=>{
      if(d) setForm({ brand_color:d.brand_color||'#000000', logo_url:d.logo_url||'', welcome_text:d.welcome_text||'', address:d.address||'' });
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await fetch(`${API_URL}/api/v1/bookings/hotel/branding`, {
        method:'PATCH',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${getToken()}`,'bypass-tunnel-reminder':'true'},
        body: JSON.stringify(form)
      });
      setSaved(true); setTimeout(()=>setSaved(false),3000);
    } catch {}
    setSaving(false);
  };

  const toLogo = (file: File) => {
    if (file.size > 2*1024*1024) { alert('Under 2MB please'); return; }
    const reader = new FileReader();
    reader.onload = ()=>setForm(f=>({...f,logo_url:reader.result as string}));
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-8" style={{fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif'}}>
      <div className="max-w-2xl mx-auto">
        <a href="../" className="text-gray-400 hover:text-black text-sm block mb-6">← Back to Dashboard</a>
        <h1 className="text-2xl font-bold mb-1">Hotel Branding</h1>
        <p className="text-gray-400 text-sm mb-8">Customise your hotel's look and feel across the platform.</p>
        {saved && <div className="mb-6 bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-xl font-medium">✅ Saved successfully</div>}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-sm mb-4">Hotel Logo</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                {form.logo_url ? <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover"/> : <span className="text-2xl">🏨</span>}
              </div>
              <div>
                <input type="file" accept="image/*" id="logo" className="hidden" onChange={e=>e.target.files?.[0]&&toLogo(e.target.files[0])}/>
                <label htmlFor="logo" className="cursor-pointer bg-black text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors">Upload Logo</label>
                <p className="text-xs text-gray-400 mt-1.5">PNG or JPG · Max 2MB</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-sm mb-4">Brand Colour</h2>
            <div className="flex items-center gap-4">
              <input type="color" value={form.brand_color} onChange={e=>setForm(f=>({...f,brand_color:e.target.value}))} className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer p-0.5"/>
              <p className="text-sm font-semibold" style={{color:form.brand_color}}>{form.brand_color}</p>
              <div className="ml-auto flex gap-2">
                {['#000000','#2563EB','#16A34A','#DC2626','#7C3AED','#EA580C'].map(c=>(
                  <button key={c} type="button" onClick={()=>setForm(f=>({...f,brand_color:c}))} className="w-7 h-7 rounded-full border-2 transition-all" style={{background:c,borderColor:form.brand_color===c?'#888':'transparent'}}/>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-sm mb-1">Welcome Message</h2>
            <p className="text-xs text-gray-400 mb-3">Shown on your hotel dashboard</p>
            <input value={form.welcome_text} onChange={e=>setForm(f=>({...f,welcome_text:e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10" placeholder="Welcome. How can we help your guests today?"/>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-sm mb-1">Hotel Address</h2>
            <p className="text-xs text-gray-400 mb-3">Default pickup location for bookings</p>
            <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10" placeholder="Full hotel address..."/>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-sm mb-4">Live Preview</h2>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-5 py-3 flex items-center gap-3" style={{background:form.brand_color}}>
                {form.logo_url ? <img src={form.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover"/> : <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-sm">H</div>}
                <span className="text-white font-bold text-sm">Your Hotel · Transit Pro</span>
              </div>
              <div className="p-4 bg-gray-50"><p className="text-sm text-gray-700">{form.welcome_text||'Welcome. How can we help your guests today?'}</p></div>
            </div>
          </div>
          <button type="submit" disabled={saving} className="w-full py-3.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50">
            {saving?'Saving...':'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
