"use client";
import { useEffect, useRef } from 'react';

interface Driver { id: string; lat: number; lng: number; name: string; status?: string; }
interface Props { hotelLat?: number; hotelLng?: number; drivers?: Driver[]; height?: string; }

export default function LiveMap({ hotelLat = 51.0693, hotelLng = -1.7942, drivers = [], height = '300px' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const LRef = useRef<any>(null);
  const driversRef = useRef<Driver[]>(drivers);

  // Keep driversRef current so the init effect can access latest drivers
  driversRef.current = drivers;

  const renderDriverMarkers = (L: any, map: any, driverList: Driver[]) => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    const colors = ['#2563EB','#7C3AED','#EA580C','#16A34A','#DC2626'];
    driverList.forEach((d, i) => {
      if (!d.lat || !d.lng) return;
      const color = colors[i % colors.length];
      const icon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);color:#fff;font-size:11px;font-weight:700">${d.name?.charAt(0)?.toUpperCase()||'D'}</div>`,
        className: '', iconSize: [32, 32], iconAnchor: [16, 16],
      });
      const m = L.marker([d.lat, d.lng], { icon, zIndexOffset: 1000 }).addTo(map);
      m.bindPopup(`<strong>${d.name}</strong><br/>${d.status||'Online'}`);
      markersRef.current.push(m);
    });
  };

  // Map init
  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    import('leaflet').then(L => {
      LRef.current = L;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current) return;
      const map = L.map(mapRef.current, { center: [hotelLat, hotelLng], zoom: 14, zoomControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19
      }).addTo(map);

      const hotelIcon = L.divIcon({
        html: `<div style="width:36px;height:36px;background:#000;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);font-weight:700;color:#fff;font-size:13px">H</div>`,
        className: '', iconSize: [36, 36], iconAnchor: [18, 18],
      });
      L.marker([hotelLat, hotelLng], { icon: hotelIcon }).addTo(map).bindPopup('<strong>Caboose Hotel</strong>');
      instanceRef.current = map;

      // Render any drivers that already arrived before map was ready
      if (driversRef.current.length > 0) {
        renderDriverMarkers(L, map, driversRef.current);
      }
    });

    return () => {
      if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; }
    };
  }, [hotelLat, hotelLng]);

  // Update driver markers when drivers prop changes
  useEffect(() => {
    if (!instanceRef.current || !LRef.current) return;
    renderDriverMarkers(LRef.current, instanceRef.current, drivers);
  }, [drivers]);

  return <div ref={mapRef} style={{ width: '100%', height, borderRadius: '12px', overflow: 'hidden' }} />;
}
