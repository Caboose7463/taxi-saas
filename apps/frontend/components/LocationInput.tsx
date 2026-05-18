"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Result { display_name: string; lat: string; lon: string; }

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  dot?: 'green' | 'red';
  required?: boolean;
  readOnly?: boolean;
}

export default function LocationInput({ value, onChange, placeholder = 'Start typing any address...', dot, required, readOnly }: Props) {
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&countrycodes=gb&limit=8&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'TransitProTaxi/1.0' } }
      );
      const data: Result[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch { setResults([]); }
    setLoading(false);
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 350);
  };

  const select = (r: Result) => {
    // Store a clean address string
    onChange(r.display_name.split(',').slice(0, 4).join(',').trim());
    setOpen(false);
  };

  const dotColor = dot === 'green' ? '#22c55e' : dot === 'red' ? '#ef4444' : undefined;

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        {dot && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full" style={{ background: dotColor }} />
        )}
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          autoComplete="off"
          className={`w-full ${dot ? 'pl-8' : 'pl-4'} pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        )}
        {!loading && value && !readOnly && (
          <button type="button" onClick={() => { onChange(''); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold w-4 h-4 flex items-center justify-center">
            x
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {results.map((r, i) => {
            const parts = r.display_name.split(',');
            const main = parts.slice(0, 2).join(',').trim();
            const sub = parts.slice(2, 5).join(',').trim();
            return (
              <button key={i} type="button" onMouseDown={() => select(r)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                <p className="text-sm font-medium text-gray-800 truncate">{main}</p>
                {sub && <p className="text-xs text-gray-400 truncate mt-0.5">{sub}</p>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
