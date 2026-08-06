'use client';

import React from 'react';
import { useSidebar } from '../../context/SidebarContext';

interface SidebarSectionProps {
  title?: string;
  children: React.ReactNode;
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="space-y-1 py-1.5">
      {title && !collapsed && (
        <div className="px-3 pt-2 pb-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            {title}
          </span>
        </div>
      )}
      {title && collapsed && (
        <div className="my-2 border-t border-white/5 mx-3" />
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}
