'use client';

import React from 'react';
import { HardDrive, LogOut, User, Settings, ShieldCheck } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';

export function SidebarFooter() {
  const { collapsed } = useSidebar();
  const { user, signOut } = useAuth();

  const usedStorageGB = 4.2;
  const totalStorageGB = 10;
  const percentage = Math.round((usedStorageGB / totalStorageGB) * 100);

  return (
    <div className="mt-auto border-t border-white/5 p-3 space-y-3 bg-slate-950/40">
      {/* Storage Indicator */}
      {!collapsed ? (
        <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> Storage
            </span>
            <span className="text-slate-300 font-mono text-[11px]">
              {usedStorageGB} GB / {totalStorageGB} GB
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-center" title={`Storage: ${usedStorageGB} GB / ${totalStorageGB} GB (${percentage}%)`}>
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center border border-white/5 text-slate-400">
            <HardDrive className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
      )}

      {/* User Profile Card */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-1.5 rounded-xl hover:bg-slate-900/80 transition-colors`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-indigo-500/20 shrink-0">
            {user?.displayName?.[0] || 'M'}
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                {user?.displayName || 'MediaHub Pro User'}
              </span>
              <span className="text-[10px] text-slate-500 truncate font-mono">
                {user?.email || 'pro@mediahub.dev'}
              </span>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={() => signOut?.()}
            title="Log out"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
