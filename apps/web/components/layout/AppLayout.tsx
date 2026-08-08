'use client';

import React from 'react';
import { SidebarProvider } from '../../context/SidebarContext';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { AppHeader } from './AppHeader';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#17181c] text-[#f2f3f5] flex overflow-x-hidden antialiased selection:bg-indigo-600 selection:text-white">
        {/* Desktop Collapsible Sidebar */}
        <Sidebar />

        {/* Mobile Slide-Over Drawer */}
        <MobileSidebar />

        {/* Main Content Area with Top Header */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar bg-[#17181c]">
          <AppHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
