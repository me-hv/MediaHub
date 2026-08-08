'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Command,
  Sparkles,
  User,
  ShieldCheck,
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
    <header className="sticky top-0 z-20 flex items-center justify-between h-[64px] px-4 lg:px-6 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 select-none">
      {/* Left Section: Mobile Menu Trigger & Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobile}
          aria-label="Open navigation menu"
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 border border-white/10 hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <button
          onClick={() => setShowSearchModal(true)}
          className="hidden sm:flex items-center gap-3 h-10 px-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-white/10 hover:border-indigo-500/40 transition-all text-xs w-64 md:w-80 justify-between group shadow-inner"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span className="truncate">Search media, downloads, tasks...</span>
          </div>
          <kbd className="flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-white/10 shrink-0">
            <Command className="w-3 h-3" /> K
          </kbd>
        </button>
      </div>

      {/* Right Section: Quick Actions, Download Activity, Notifications & Avatar */}
      <div className="flex items-center gap-2.5">
        {/* Active Download Indicator */}
        <HeaderDownloadIndicator />

        {/* Quick Download Action */}
        <Link
          href="/"
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Download</span>
        </Link>

        {/* Notifications Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-white/10 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-950 animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-400" /> System Notifications
                </span>
                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-mono">
                  2 New
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                  <p className="font-semibold text-slate-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Conversion Pipeline Ready
                  </p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    FFmpeg audio transcode engine active for MP3, FLAC, WAV, AAC, and OGG downloads.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                  <p className="font-semibold text-slate-200 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> MediaHub Desktop Layout Active
                  </p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Collapsible sidebar & desktop navigation enabled.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-indigo-500/20 shadow-md">
            {user?.displayName?.[0] || 'M'}
          </div>
        </div>
      </div>
    </header>
  );
}
