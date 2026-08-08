'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, PanelLeft, PanelLeftClose } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

export function SidebarHeader() {
  const { collapsed, toggleCollapsed } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`flex items-center h-[56px] px-4 border-b border-[#2a2d32] bg-[#121316] select-none ${
        collapsed ? 'justify-center' : 'justify-between'
      }`}
    >
      {/* When Collapsed: Logo acts as Expand Trigger on Hover/Click */}
      {collapsed ? (
        <button
          onClick={toggleCollapsed}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="Expand sidebar"
          className="relative flex items-center justify-center w-9 h-9 rounded-md bg-[#1c1e22] border border-[#2a2d32] hover:border-indigo-500/50 hover:bg-[#22252a] text-white transition-all duration-200 group focus:outline-none"
        >
          {isHovered ? (
            <PanelLeft className="w-4 h-4 text-indigo-400 transition-opacity duration-200" />
          ) : (
            <Sparkles className="w-4 h-4 text-indigo-400 transition-opacity duration-200" />
          )}
        </button>
      ) : (
        /* When Expanded: Brand Title & Collapse Control */
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-[#f2f3f5]">
                MediaHub
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono text-[#9a9da5] bg-[#1c1e22] rounded border border-[#2a2d32]">
                PRO
              </span>
            </div>
          </Link>

          <button
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            className="flex items-center justify-center w-7 h-7 rounded text-[#9a9da5] hover:text-[#f2f3f5] hover:bg-[#1c1e22] transition-colors focus:outline-none"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
