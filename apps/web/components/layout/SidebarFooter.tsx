'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';

export function SidebarFooter() {
  const { collapsed } = useSidebar();
  const { user, signOut } = useAuth();

  return (
    <div className="mt-auto border-t border-[#2a2d32] p-2.5 bg-[#121316]">
      {/* User Profile Area */}
      <div
        className={`flex items-center ${
          collapsed ? 'justify-center' : 'justify-between'
        } p-1.5 rounded-md hover:bg-[#1c1e22] transition-colors`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
            {user?.displayName?.[0] || 'M'}
            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-[#121316]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-[#f2f3f5] truncate">
                {user?.displayName || 'MediaHub Pro User'}
              </span>
              <span className="text-[10px] text-[#9a9da5] truncate font-mono">
                {user?.email || 'pro@mediahub.dev'}
              </span>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={() => signOut?.()}
            title="Log out"
            aria-label="Log out"
            className="w-6 h-6 rounded flex items-center justify-center text-[#9a9da5] hover:text-rose-400 hover:bg-[#22252a] transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
