"use client";
import { API_URL } from '@/lib/api';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const DOCS = [
  { key:'licenceDoc', label:'Driving Licence', desc:'Front and back', required:true },
  { key:'phLicenceDoc', label:'Private Hire Licence', desc:'Issued by local authority', required:true },
  { key:'insuranceDoc', label:'Insurance Certificate', desc:'Valid hire & reward', required:true },
  { key:'motDoc', label:'MOT Certificate', desc:'Current & valid', required:true },
  { key:'profilePhoto', label:'Profile Photo', desc:'Clear headshot', required:true },
];

export default function DriverSignup() {
  const router = useRouter();
  const [step, setStep] = useState<'details'|'vehicle'|'docs'|'done'>('details');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', vehicleMake:'', vehicleModel:'', vehicleReg:'', vehicleColour:'' });
  const [docs, setDocs] = useState<Record<string,string>>({});
  const [error, setError] = useState('');

  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}));

  const toBase64 = (file:File): Promise<string> => new Promise((res,rej) => {
    const r = new FileReader(); r.onload = ()=>res(r.result as string); r.onerror=rej; r.readAsDataURL(file);
  });

  const handleFile = async (key:string, file:File|null) => {
    if (!file) return;
    if (file.size > 5*1024*1024) { setError('File must be under 5MB'); return; }
    const b64 = await toBase64(file);
    setDocs(d=>({...d,[key]:b64}));
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/driver/signup`, {
        method:'POST',
        headers:{'Content-Type':'application/json','bypass-tunnel-reminder':'true'},
        body: JSON.stringify({...form,...docs})
      });
      if (res.ok) { setStep('done'); }
      else { const e=await res.json(); setError(e.message||'Signup failed'); }
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  };

  const inp = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all";

  if (step==='done') return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-sm border border-gray-100">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
        <p className="text-gray-500 text-sm mb-6">Your application is under review. You'll receive an email once approved — usually within 24 hours.</p>
        <a href="/driver/login" className="block w-full bg-black text-white py-3 rounded-xl font-bold text-sm text-center">Go to Driver Login</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6" style={{fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif'}}>
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-bold text-sm">T</div>
          <div><h1 className="font-bold text-lg">Driver Application</h1><p className="text-xs text-gray-400">Join the Transit Pro network</p></div>
        </div>

        {/* Steps */}
        <div className="flex gap-2 mb-8">
          {[['details','1','Your Details'],['vehicle','2','Vehicle'],['docs','3','Documents']].map(([s,n,l])=>(
            <div key={s} className={`flex-1 text-center`}>
              <div className={`w-7 h-7 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold ${step===s?'bg-black text-white':['vehicle','docs'].includes(step)&&['details'].includes(s)?'bg-green-500 text-white':step==='docs'&&s==='vehicle'?'bg-green-500 text-white':'bg-gray-100 text-gray-500'}`}>{n}</div>
              <p className="text-xs text-gray-500">{l}</p>
            </div>
          ))}
        </div>

        {error&&<div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-xl">{error}</div>}

        {step==='details'&&(
          <div className="space-y-4">
            <h2 className="font-bold text-base mb-4">Personal Details</h2>
            <input value={form.name} onChange={e=>set('name',e.target.value)} className={inp} placeholder="Full name" required/>
            <input value={form.email} onChange={e=>set('email',e.target.value)} className={inp} placeholder="Email address" type="email" required/>
            <input value={form.phone} onChange={e=>set('phone',e.target.value)} className={inp} placeholder="Mobile number (+44...)" type="tel" required/>
            <input value={form.password} onChange={e=>set('password',e.target.value)} className={inp} placeholder="Create password (min 8 chars)" type="password" required/>
            <button disabled={!form.name||!form.email||!form.phone||!form.password} onClick={()=>setStep('vehicle')} className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40">Continue →</button>
          </div>
        )}

        {step==='vehicle'&&(
          <div className="space-y-4">
            <h2 className="font-bold text-base mb-4">Vehicle Details</h2>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.vehicleMake} onChange={e=>set('vehicleMake',e.target.value)} className={inp} placeholder="Make (e.g. Toyota)"/>
              <input value={form.vehicleModel} onChange={e=>set('vehicleModel',e.target.value)} className={inp} placeholder="Model (e.g. Prius)"/>
              <input value={form.vehicleReg} onChange={e=>set('vehicleReg',e.target.value.toUpperCase())} className={inp} placeholder="Reg (e.g. SA21 ABC)"/>
              <input value={form.vehicleColour} onChange={e=>set('vehicleColour',e.target.value)} className={inp} placeholder="Colour"/>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setStep('details')} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">← Back</button>
              <button disabled={!form.vehicleMake||!form.vehicleReg} onClick={()=>setStep('docs')} className="flex-1 bg-black text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40">Continue →</button>
            </div>
          </div>
        )}

        {step==='docs'&&(
          <div className="space-y-4">
            <h2 className="font-bold text-base mb-1">Upload Documents</h2>
            <p className="text-xs text-gray-400 mb-4">All documents required. Max 5MB each. Accepted: JPG, PNG, PDF.</p>
            {DOCS.map(({key,label,desc,required})=>(
              <div key={key} className={`border rounded-xl p-3 transition-all ${docs[key]?'border-green-300 bg-green-50':'border-gray-200 bg-gray-50'}`}>
                <div className="flex justify-between items-start mb-1">
                  <div><p className="text-sm font-semibold">{label}{required&&<span className="text-red-400 ml-1">*</span>}</p><p className="text-xs text-gray-400">{desc}</p></div>
                  {docs[key]&&<span className="text-green-500 text-lg">✓</span>}
                </div>
                <input type="file" accept="image/*,.pdf" onChange={e=>handleFile(key,e.target.files?.[0]||null)}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-black file:text-white file:text-xs file:font-medium cursor-pointer"/>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setStep('vehicle')} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">← Back</button>
              <button onClick={handleSubmit} disabled={loading||DOCS.filter(d=>d.required).some(d=>!docs[d.key])} className="flex-1 bg-black text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40">
                {loading?'Submitting...':'Submit Application'}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">Already approved? <a href="/driver/login" className="text-black font-medium">Log in →</a></p>
      </div>
    </div>
  );
}
