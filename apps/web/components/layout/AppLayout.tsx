'use client';

import React from 'react';
import { SidebarProvider } from '../../context/SidebarContext';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { AppHeader } from './AppHeader';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-x-hidden antialiased selection:bg-indigo-500 selection:text-white">
        {/* Desktop Collapsible Sidebar */}
        <Sidebar />

        {/* Mobile Slide-Over Drawer */}
        <MobileSidebar />

        {/* Main Content Area with Compact Header */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar">
          <AppHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
