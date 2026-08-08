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
        className={`group relative flex items-center w-full h-[36px] rounded-md text-xs font-medium transition-colors ${
          collapsed ? 'justify-center px-0' : 'justify-between px-2.5'
        } ${
          isActive
            ? 'bg-[#1c1e22] text-[#f2f3f5] border border-[#2a2d32]'
            : 'text-[#9a9da5] hover:text-[#f2f3f5] hover:bg-[#18191c]'
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

        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive ? 'text-indigo-400' : 'text-[#9a9da5] group-hover:text-[#f2f3f5]'
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
              <span className="px-1.5 py-0.2 text-[10px] font-medium rounded bg-[#1c1e22] text-[#9a9da5] font-mono border border-[#2a2d32]">
                {badge}
              </span>
            )}
            {shortcut && (
              <span className="hidden group-hover:inline-block px-1.5 py-0.2 text-[10px] font-mono text-[#6f737d] bg-[#121316] rounded border border-[#2a2d32]">
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
            className="absolute left-full ml-2 px-2.5 py-1 bg-[#1c1e22] border border-[#2a2d32] text-xs text-[#f2f3f5] rounded shadow-lg font-medium whitespace-nowrap z-50 pointer-events-none flex items-center gap-2"
          >
            <span>{label}</span>
            {badge !== undefined && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-[#121316] text-[#9a9da5] font-mono">
                {badge}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
