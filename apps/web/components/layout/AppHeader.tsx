'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Command,
  User,
  CheckCircle2,
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { HeaderDownloadIndicator } from './HeaderDownloadIndicator';

export function AppHeader() {
  const { toggleMobile } = useSidebar();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-[56px] px-4 lg:px-6 bg-[#08090c]/90 backdrop-blur-md border-b border-white/10 select-none">
      {/* Left Section: Mobile Menu Trigger & Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobile}
          aria-label="Open navigation menu"
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-white bg-[#0d0f14] border border-white/10 transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Global Search Bar */}
        <button
          onClick={() => setShowSearchModal(true)}
          className="hidden sm:flex items-center gap-3 h-8 px-3 rounded-md bg-[#0d0f14] hover:bg-[#13161c] text-slate-400 hover:text-slate-200 border border-white/10 transition-colors text-xs w-64 md:w-80 justify-between group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
            <span className="truncate">Search media, downloads, tasks...</span>
          </div>
          <kbd className="flex items-center gap-0.5 text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.2 rounded border border-white/5 shrink-0">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right Section: Quick Actions, Download Activity, Notifications & Avatar */}
      <div className="flex items-center gap-2">
        {/* Active Download Indicator */}
        <HeaderDownloadIndicator />

        {/* Quick Download Action */}
        <Link
          href="/"
          className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Download</span>
        </Link>

        {/* Notifications Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-white bg-[#0d0f14] hover:bg-[#13161c] border border-white/10 transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0d0f14] border border-white/10 rounded-lg shadow-xl p-3.5 space-y-2.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-400" /> Notifications
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded font-mono">
                  2 New
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded bg-[#12151c] border border-white/5 space-y-1">
                  <p className="font-medium text-slate-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Conversion Pipeline Active
                  </p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    FFmpeg transcode engine ready for FLAC, WAV, MP3, AAC, and OGG downloads.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-md bg-slate-800 border border-white/10 flex items-center justify-center text-white font-medium text-xs">
            {user?.displayName?.[0] || 'M'}
          </div>
        </div>
      </div>
    </header>
  );
}
