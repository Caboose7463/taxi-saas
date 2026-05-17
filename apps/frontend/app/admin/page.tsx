"use client";
import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="flex h-screen w-full bg-[var(--background)]">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col p-6 shadow-sm z-10 text-white">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <span className="font-semibold tracking-wide text-sm text-gray-200">SUPER ADMIN</span>
        </div>
        
        <nav className="flex flex-col gap-2">
          <a href="#" className="px-4 py-2.5 rounded-lg bg-gray-800 text-white flex items-center gap-3 text-sm font-medium">
            Dashboard
          </a>
          <a href="#" className="px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white flex items-center gap-3 text-sm font-medium">
            Hotels
          </a>
          <a href="#" className="px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white flex items-center gap-3 text-sm font-medium">
            Drivers
          </a>
          <a href="#" className="px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white flex items-center gap-3 text-sm font-medium">
            Global Analytics
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
            <p className="text-gray-500 mt-1">Manage all hotels, drivers, and view platform metrics.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">Admin User</p>
              <p className="text-xs text-gray-500">Platform Owner</p>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full border border-gray-300 overflow-hidden flex items-center justify-center text-xl">
               👨‍💻
            </div>
          </div>
        </header>

        {/* Metrics Row */}
        <div className="grid grid-cols-4 gap-6 mb-10">
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
             <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Total Hotels</p>
             <h2 className="text-3xl font-bold">14</h2>
           </div>
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
             <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Active Drivers</p>
             <h2 className="text-3xl font-bold">86</h2>
           </div>
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
             <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Today's Bookings</p>
             <h2 className="text-3xl font-bold">342</h2>
           </div>
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 bg-blue-50/50">
             <p className="text-sm text-blue-600 font-bold uppercase tracking-wider mb-2">Platform Revenue (7.5%)</p>
             <h2 className="text-3xl font-bold text-blue-700">£1,245.50</h2>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Recent Hotels */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Active Hotels</h3>
              <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">Add New +</button>
            </div>
            <div className="space-y-4">
               {[
                 { name: 'The Grand Hotel', subdomain: 'grandhotel', bookings: 124 },
                 { name: 'Riverside Suites', subdomain: 'riverside', bookings: 89 },
                 { name: 'Airport Express Inn', subdomain: 'airportinn', bookings: 312 },
               ].map((hotel, i) => (
                 <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                   <div>
                     <p className="font-semibold">{hotel.name}</p>
                     <p className="text-xs text-gray-400">https://{hotel.subdomain}.taxisaas.com</p>
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-gray-900">{hotel.bookings}</p>
                     <p className="text-xs text-gray-400">Bookings</p>
                   </div>
                 </div>
               ))}
            </div>
          </div>

          {/* Pending Drivers */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Pending Driver Approvals</h3>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">3 Action Required</span>
            </div>
            <div className="space-y-4">
               {[
                 { name: 'Michael C.', vehicle: 'Mercedes E-Class (Black)', docs: 'All docs uploaded' },
                 { name: 'David R.', vehicle: 'Toyota Prius (Silver)', docs: 'Missing Insurance' },
                 { name: 'James T.', vehicle: 'Tesla Model S (White)', docs: 'All docs uploaded' },
               ].map((driver, i) => (
                 <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                   <div>
                     <p className="font-semibold">{driver.name}</p>
                     <p className="text-xs text-gray-500">{driver.vehicle}</p>
                     <p className={`text-[10px] font-bold mt-1 ${driver.docs.includes('Missing') ? 'text-red-500' : 'text-green-500'}`}>{driver.docs}</p>
                   </div>
                   <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                     Review
                   </button>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
