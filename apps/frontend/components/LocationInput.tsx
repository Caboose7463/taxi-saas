"use client";
import React, { useState, useRef, useEffect } from 'react';

const UK_LOCATIONS = [
  // Airports
  'London Heathrow Airport (LHR)',
  'London Gatwick Airport (LGW)',
  'London Stansted Airport (STN)',
  'London Luton Airport (LTN)',
  'London City Airport (LCY)',
  'Southampton Airport',
  'Bristol Airport',
  'Birmingham Airport (BHX)',
  'Manchester Airport (MAN)',
  // Train Stations
  'London Waterloo Station',
  'London Paddington Station',
  'London Victoria Station',
  'London Liverpool Street Station',
  'London Kings Cross Station',
  'Southampton Central Station',
  'Basingstoke Station',
  'Andover Station',
  'Salisbury Station',
  'Bath Spa Station',
  'Bristol Temple Meads Station',
  'Bournemouth Station',
  'Romsey Station',
  'Winchester Station',
  // Cities & Areas
  'Salisbury City Centre',
  'Salisbury District Hospital',
  'Southampton City Centre',
  'Southampton General Hospital',
  'Bournemouth City Centre',
  'Bournemouth Beach',
  'Bath City Centre',
  'Bristol City Centre',
  'Portsmouth City Centre',
  'Winchester City Centre',
  'Andover Town Centre',
  'Basingstoke Town Centre',
  'Romsey Town Centre',
  'Amesbury',
  'Stonehenge',
  'Stonehenge Visitor Centre',
  'New Forest National Park',
  'Boscombe',
  // Hotels & Venues
  'Heathrow Terminal 2',
  'Heathrow Terminal 3',
  'Heathrow Terminal 4',
  'Heathrow Terminal 5',
  'Gatwick North Terminal',
  'Gatwick South Terminal',
];

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  dot?: 'green' | 'red';
  required?: boolean;
  readOnly?: boolean;
}

export default function LocationInput({ value, onChange, placeholder = 'Enter location...', dot, required, readOnly }: Props) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (val.length > 1) {
      const q = val.toLowerCase();
      setFiltered(UK_LOCATIONS.filter(l => l.toLowerCase().includes(q)).slice(0, 8));
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleFocus = () => {
    if (!value) {
      setFiltered(UK_LOCATIONS.slice(0, 8));
      setOpen(true);
    }
  };

  const select = (loc: string) => { onChange(loc); setOpen(false); };

  const dotColor = dot === 'green' ? '#22c55e' : dot === 'red' ? '#ef4444' : undefined;

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        {dot && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background: dotColor}}/>
        )}
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          className={`w-full ${dot ? 'pl-8' : 'pl-4'} pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all ${readOnly ? 'cursor-default' : ''}`}
        />
        {value && !readOnly && (
          <button type="button" onClick={() => { onChange(''); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold">
            x
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {filtered.map(loc => (
            <button key={loc} type="button" onMouseDown={() => select(loc)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
              <span className="text-gray-400 text-xs mr-2">&#9679;</span>{loc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
