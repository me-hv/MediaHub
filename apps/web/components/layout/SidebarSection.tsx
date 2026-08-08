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
    <div className="space-y-1 py-1">
      {title && !collapsed && (
        <div className="px-2.5 pt-1.5 pb-1">
          <span className="text-[10px] font-semibold text-[#6f737d] uppercase tracking-wider font-mono">
            {title}
          </span>
        </div>
      )}
      {title && collapsed && (
        <div className="my-1.5 border-t border-[#2a2d32] mx-2" />
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
