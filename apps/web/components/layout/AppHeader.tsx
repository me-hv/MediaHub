'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Command,
  CheckCircle2,
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { HeaderDownloadIndicator } from './HeaderDownloadIndicator';

export function AppHeader() {
  const { toggleMobile } = useSidebar();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-[60px] px-4 lg:px-6 bg-[#151619] border-b border-[#2a2d32] select-none">
      {/* Left Section: Mobile Menu Trigger & Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobile}
          aria-label="Open navigation menu"
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md text-[#9a9da5] hover:text-[#f2f3f5] bg-[#1c1e22] border border-[#2a2d32] transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Global Search Bar */}
        <button
          className="hidden sm:flex items-center gap-3 h-9 px-3 rounded-md bg-[#1c1e22] hover:bg-[#22252a] text-[#9a9da5] hover:text-[#f2f3f5] border border-[#2a2d32] transition-colors text-xs w-64 md:w-80 justify-between group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#6f737d] group-hover:text-[#9a9da5] transition-colors" />
            <span className="truncate">Search media, downloads, tasks...</span>
          </div>
          <kbd className="flex items-center gap-0.5 text-[10px] font-mono text-[#6f737d] bg-[#121316] px-1.5 py-0.2 rounded border border-[#2a2d32] shrink-0">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right Section: Download Activity, New Download, Notifications & Avatar */}
      <div className="flex items-center gap-2.5">
        {/* Active Download Indicator */}
        <HeaderDownloadIndicator />

        {/* Quick Download Action */}
        <Link
          href="/"
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Download</span>
        </Link>

        {/* Notifications Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative flex items-center justify-center w-9 h-9 rounded-md text-[#9a9da5] hover:text-[#f2f3f5] bg-[#1c1e22] hover:bg-[#22252a] border border-[#2a2d32] transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#1c1e22] border border-[#2a2d32] rounded-lg shadow-xl p-3.5 space-y-2.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-[#2a2d32] pb-2">
                <span className="text-xs font-semibold text-[#f2f3f5] flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-400" /> System Notifications
                </span>
                <span className="text-[10px] text-[#9a9da5] bg-[#121316] px-1.5 py-0.2 rounded font-mono border border-[#2a2d32]">
                  2 New
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded bg-[#121316] border border-[#2a2d32] space-y-1">
                  <p className="font-medium text-[#f2f3f5] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Conversion Pipeline Active
                  </p>
                  <p className="text-[11px] text-[#9a9da5] leading-normal">
                    FFmpeg transcode engine ready for FLAC, WAV, MP3, AAC, and OGG downloads.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center pl-1">
          <div className="w-9 h-9 rounded-md bg-[#1c1e22] border border-[#2a2d32] flex items-center justify-center text-[#f2f3f5] font-medium text-xs">
            {user?.displayName?.[0] || 'M'}
          </div>
        </div>
      </div>
    </header>
  );
}
