'use client';
import { API_URL } from '@/lib/api';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

const STATUS_STEPS = ['PENDING','ACCEPTED','EN_ROUTE','ARRIVED','PASSENGER_ONBOARD','COMPLETED'];
const STATUS_LABEL: Record<string,string> = {
  PENDING: 'Finding your driver...',
  ACCEPTED: 'Driver confirmed',
  EN_ROUTE: 'Driver on the way',
  ARRIVED: 'Driver has arrived',
  PASSENGER_ONBOARD: 'Journey in progress',
  COMPLETED: 'You have arrived!',
  CANCELLED: 'Booking cancelled',
};
const STATUS_ICON: Record<string,string> = {
  PENDING: '🔍', ACCEPTED: '✅', EN_ROUTE: '🚗', ARRIVED: '📍', PASSENGER_ONBOARD: '🛣️', COMPLETED: '🏁', CANCELLED: '❌',
};
const STATUS_COLOR: Record<string,string> = {
  PENDING: '#6B7280', ACCEPTED: '#2563EB', EN_ROUTE: '#F59E0B', ARRIVED: '#10B981', PASSENGER_ONBOARD: '#8B5CF6', COMPLETED: '#10B981', CANCELLED: '#EF4444',
};

export default function TrackPage() {
  const params = useParams();
  const token = params?.token as string;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const mapRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInitialized = useRef(false);

  const fetchBooking = async () => {
    try {
      const r = await fetch(`${API_URL}/api/v1/bookings/track/${token}`, {
        headers: { 'bypass-tunnel-reminder': 'true' }
      });
      if (r.ok) {
        const data = await r.json();
        setBooking(data);
        setLastUpdated(new Date());
        // Update driver marker if map exists
        if (mapRef.current && data?.driver?.lat && data?.driver?.lng) {
          const pos: [number, number] = [data.driver.lat, data.driver.lng];
          if (driverMarkerRef.current) {
            driverMarkerRef.current.setLatLng(pos);
          }
        }
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (!token) return;
    fetchBooking();
    const interval = setInterval(fetchBooking, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!booking || mapInitialized.current || !mapDivRef.current) return;
    if (booking.status === 'CANCELLED') return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      mapInitialized.current = true;

      const centerLat = booking.driver?.lat || 51.07;
      const centerLng = booking.driver?.lng || -1.80;

      const map = L.map(mapDivRef.current!, {
        center: [centerLat, centerLng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // Driver marker
      if (booking.driver?.lat && booking.driver?.lng) {
        const driverIcon = L.divIcon({
          html: `<div style="width:36px;height:36px;background:#2563EB;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 12px rgba(37,99,235,0.6)">🚗</div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        driverMarkerRef.current = L.marker([booking.driver.lat, booking.driver.lng], { icon: driverIcon }).addTo(map);
      }
    };
    initMap();
  }, [booking]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #333', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}/>
        <p style={{ color: '#666', fontSize: 14 }}>Loading your ride...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!booking) return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❓</div>
        <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Booking not found</p>
        <p style={{ color: '#666', fontSize: 14 }}>This tracking link may have expired or is invalid.</p>
      </div>
    </div>
  );

  const statusIndex = STATUS_STEPS.indexOf(booking.status);
  const isComplete = booking.status === 'COMPLETED';
  const isCancelled = booking.status === 'CANCELLED';
  const hasDriver = booking.driver && booking.status !== 'PENDING';
  const accentColor = STATUS_COLOR[booking.status] || '#2563EB';

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', color: '#fff' }}>
      {/* Top bar */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#000' }}>C</div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>CABOOSE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a1a1a', borderRadius: 20, padding: '6px 12px' }}>
          <div style={{ width: 6, height: 6, background: '#10B981', borderRadius: '50%', animation: isCancelled || isComplete ? 'none' : 'pulse 2s infinite' }}/>
          <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      {/* Map */}
      {!isCancelled && (
        <div style={{ height: 260, position: 'relative', background: '#111' }}>
          <div ref={mapDivRef} style={{ width: '100%', height: '100%' }}/>
          {!booking.driver?.lat && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 32 }}>📡</div>
              <p style={{ color: '#555', fontSize: 13 }}>Waiting for driver location...</p>
            </div>
          )}
        </div>
      )}

      {/* Status card */}
      <div style={{ padding: '20px 20px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ background: '#111', borderRadius: 20, padding: 20, border: `1px solid ${accentColor}33`, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, background: `${accentColor}22`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              {STATUS_ICON[booking.status] || '🚖'}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Status</p>
              <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: accentColor }}>{STATUS_LABEL[booking.status] || booking.status}</p>
            </div>
          </div>

          {/* Progress bar */}
          {!isCancelled && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 0 }}>
              {STATUS_STEPS.slice(0, 6).map((s, i) => (
                <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= statusIndex ? accentColor : '#222', transition: 'background 0.5s' }}/>
              ))}
            </div>
          )}
        </div>

        {/* Driver card */}
        {hasDriver && (
          <div style={{ background: '#111', borderRadius: 20, padding: 20, border: '1px solid #1f1f1f', marginBottom: 16 }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Your Driver</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, background: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, flexShrink: 0 }}>
                {booking.driver.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{booking.driver.name}</p>
                {(booking.driver.vehicleMake || booking.driver.vehicleModel) && (
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#888' }}>
                    {[booking.driver.vehicleColour, booking.driver.vehicleMake, booking.driver.vehicleModel].filter(Boolean).join(' ')}
                    {booking.driver.vehicleReg && <span style={{ marginLeft: 8, background: '#1f1f1f', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>{booking.driver.vehicleReg}</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Journey details */}
        <div style={{ background: '#111', borderRadius: 20, padding: 20, border: '1px solid #1f1f1f', marginBottom: 16 }}>
          <p style={{ margin: '0 0 14px', fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Your Journey</p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 10, height: 10, background: '#10B981', borderRadius: '50%', marginTop: 4, flexShrink: 0 }}/>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#555' }}>PICKUP</p>
              <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600 }}>{booking.pickupAddress}</p>
            </div>
          </div>
          <div style={{ width: 1, height: 16, background: '#222', marginLeft: 4.5, marginBottom: 0 }}/>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 0 }}>
            <div style={{ width: 10, height: 10, background: '#EF4444', borderRadius: 2, marginTop: 4, flexShrink: 0 }}/>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#555' }}>DROP-OFF</p>
              <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600 }}>{booking.dropoffAddress}</p>
            </div>
          </div>
          {booking.distanceMiles > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 11, color: '#555' }}>Distance</p>
                <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800 }}>{booking.distanceMiles?.toFixed(1)} mi</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 11, color: '#555' }}>Passengers</p>
                <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800 }}>{booking.passengerCount}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 11, color: '#555' }}>Hotel</p>
                <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800 }}>{booking.hotel?.name?.split(' ')[0]}</p>
              </div>
            </div>
          )}
        </div>

        {/* Completed state */}
        {isComplete && (
          <div style={{ background: '#052e16', borderRadius: 20, padding: 24, border: '1px solid #166534', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏁</div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#4ade80' }}>You've arrived!</p>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#166534' }}>We hope you had a great journey. Safe travels!</p>
          </div>
        )}

        <p style={{ textAlign: 'center', color: '#333', fontSize: 11, padding: '0 0 32px' }}>Powered by Caboose · Auto-refreshes every 10s</p>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
