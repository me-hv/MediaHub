'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

export function SidebarHeader() {
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <div className={`flex items-center h-[64px] px-4 border-b border-white/5 ${
      collapsed ? 'justify-center' : 'justify-between'
    }`}>
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-200 shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>

        {!collapsed && (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                MediaHub
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono tracking-tight">SaaS Media Engine</span>
          </div>
        )}
      </Link>

      <button
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={`hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-transparent hover:border-white/10 ${
          collapsed ? 'mt-0' : ''
        }`}
      >
        {collapsed ? (
          <PanelLeft className="w-4 h-4 text-indigo-400" />
        ) : (
          <PanelLeftClose className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
