'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  shortcut?: string;
  onClick?: () => void;
}

export function SidebarItem({ href, label, icon: Icon, badge, shortcut, onClick }: SidebarItemProps) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const [showTooltip, setShowTooltip] = useState(false);

  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <div className="relative flex items-center">
      <Link
        href={href}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`group relative flex items-center w-full h-[38px] rounded-md px-2.5 text-xs font-medium transition-colors ${
          collapsed ? 'justify-center' : 'justify-between'
        } ${
          isActive
            ? 'bg-[#13161c] text-white border border-white/10'
            : 'text-slate-400 hover:text-slate-200 hover:bg-[#0d0f14]'
        }`}
      >
        {/* Active Indicator Bar */}
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-indigo-500 rounded-r"
            transition={{ duration: 0.15 }}
          />
        )}

        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />
          {!collapsed && (
            <span className="truncate tracking-tight font-medium text-xs">
              {label}
            </span>
          )}
        </div>

        {!collapsed && (
          <div className="flex items-center gap-1.5 shrink-0">
            {badge !== undefined && (
              <span className="px-1.5 py-0.2 text-[10px] font-medium rounded bg-slate-800 text-slate-300 font-mono border border-white/5">
                {badge}
              </span>
            )}
            {shortcut && (
              <span className="hidden group-hover:inline-block px-1.5 py-0.2 text-[10px] font-mono text-slate-500 bg-slate-900 rounded border border-white/5">
                {shortcut}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Floating Hover Tooltip for Collapsed Sidebar */}
      <AnimatePresence>
        {collapsed && showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.1 }}
            className="absolute left-full ml-2 px-2.5 py-1 bg-[#0d0f14] border border-white/10 text-xs text-white rounded shadow-lg font-medium whitespace-nowrap z-50 pointer-events-none flex items-center gap-2"
          >
            <span>{label}</span>
            {badge !== undefined && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-slate-800 text-slate-300 font-mono">
                {badge}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
