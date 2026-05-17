"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Read the JWT token and redirect to the correct dashboard
    const token = document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;
      if (role === 'hotel_staff') {
        // Get subdomain from token or default
        const subdomain = payload.subdomain || 'grandhotel';
        router.replace(`/hotel/${subdomain}`);
      } else if (role === 'driver') {
        router.replace('/driver/dashboard');
      } else if (role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Loading your dashboard...</p>
      </div>
    </div>
  );
}
