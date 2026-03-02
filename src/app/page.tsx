'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import FileUpload from '@/components/FileUpload';
import ServiceDashboard from '@/components/ServiceView/ServiceDashboard';
import ProductDashboard from '@/components/ProductView/ProductDashboard';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  const { isDataLoaded } = useData();
  const [activeTab, setActiveTab] = useState<'Service' | 'Product'>('Service');

  if (!isDataLoaded) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
        <FileUpload />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-200">
      {/* Top Header / Navigation */}
      <header className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-50 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">
            Dara Aroma <span className="text-blue-600 dark:text-blue-400">Dashboard</span>
          </h1>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-4"></div>
          {/* Tabs */}
          <nav className="flex space-x-2">
            <button
              onClick={() => setActiveTab('Service')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition ${activeTab === 'Service'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
            >
              Service Overview
            </button>
            <button
              onClick={() => setActiveTab('Product')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition ${activeTab === 'Product'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
            >
              Product Sales
            </button>
          </nav>
        </div>

        {/* Config / Features area */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button onClick={() => window.location.reload()} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline transition-colors">
            Reset Data
          </button>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-[1920px] mx-auto p-4 md:p-8">
        {activeTab === 'Service' ? <ServiceDashboard /> : <ProductDashboard />}
      </div>
    </main>
  );
}
