"use client";
import { useEffect, useRef } from 'react';

interface Driver { id: string; lat: number; lng: number; name: string; color: string; }
interface Props { hotelLat?: number; hotelLng?: number; drivers?: Driver[]; height?: string; }

export default function LiveMap({ hotelLat = 51.0693, hotelLng = -1.7942, drivers = [], height = '100%' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstanceRef.current) return;
    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      if (!mapRef.current) return;
      const map = L.map(mapRef.current, { center:[hotelLat,hotelLng], zoom:13, zoomControl:true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap', maxZoom:19 }).addTo(map);
      const hotelIcon = L.divIcon({
        html:`<div style="width:36px;height:36px;background:#000;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-weight:700;color:#fff;font-size:13px">H</div>`,
        className:'', iconSize:[36,36], iconAnchor:[18,18]
      });
      L.marker([hotelLat,hotelLng],{icon:hotelIcon}).addTo(map).bindPopup('<strong>Your Hotel</strong>');
      mapInstanceRef.current = map;
    });
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [hotelLat, hotelLng]);

  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;
    import('leaflet').then(L => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      drivers.forEach(d => {
        const icon = L.divIcon({
          html:`<div style="width:30px;height:30px;background:${d.color};border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.2);color:#fff;font-size:10px;font-weight:700">${d.id}</div>`,
          className:'', iconSize:[30,30], iconAnchor:[15,15]
        });
        const marker = L.marker([d.lat,d.lng],{icon}).addTo(mapInstanceRef.current).bindPopup(`<strong>${d.name}</strong><br/>Online`);
        markersRef.current.push(marker);
      });
    });
  }, [drivers]);

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
      <div ref={mapRef} style={{width:'100%',height,minHeight:'240px',borderRadius:'12px',overflow:'hidden'}}/>
    </>
  );
}
