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
        className={`group relative flex items-center w-full h-[44px] rounded-xl px-3 text-sm font-medium transition-all duration-200 ${
          collapsed ? 'justify-center' : 'justify-between'
        } ${
          isActive
            ? 'bg-indigo-600/15 text-white border border-indigo-500/30 shadow-sm'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
        }`}
      >
        {/* Active Indicator Bar */}
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.8)]"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}

        <div className={`flex items-center gap-3.5 ${collapsed ? 'justify-center' : ''}`}>
          <Icon
            className={`w-5 h-5 shrink-0 transition-colors duration-200 ${
              isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />
          {!collapsed && (
            <span className="truncate tracking-tight font-medium text-[13.5px]">
              {label}
            </span>
          )}
        </div>

        {!collapsed && (
          <div className="flex items-center gap-1.5 shrink-0">
            {badge !== undefined && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                {badge}
              </span>
            )}
            {shortcut && (
              <span className="hidden group-hover:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800/80 rounded border border-white/5">
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
            initial={{ opacity: 0, x: 8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 border border-white/15 text-xs text-white rounded-lg shadow-2xl font-medium whitespace-nowrap z-50 pointer-events-none flex items-center gap-2"
          >
            <span>{label}</span>
            {badge !== undefined && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-500/30 text-indigo-300 font-mono">
                {badge}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
