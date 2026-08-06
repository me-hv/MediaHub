'use client';

import React, { useEffect } from 'react';
import {
  ArrowDownCircle,
  LayoutDashboard,
  History,
  Heart,
  Layers,
  ListMusic,
  Code,
  Building,
  Settings,
  X,
  Sparkles,
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { SidebarSection } from './SidebarSection';
import { SidebarItem } from './SidebarItem';
import { SidebarFooter } from './SidebarFooter';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileSidebar() {
  const { mobileOpen, setMobileOpen } = useSidebar();

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, setMobileOpen]);

  return (
    <AnimatePresence>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Dark Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Drawer Content */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 bottom-0 left-0 w-[280px] bg-slate-950 border-r border-white/10 flex flex-col z-50 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-[64px] px-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-bold text-white text-base">MediaHub</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <SidebarSection title="Core Tools">
                <SidebarItem
                  href="/"
                  label="Downloader"
                  icon={ArrowDownCircle}
                  onClick={() => setMobileOpen(false)}
                />
                <SidebarItem
                  href="/dashboard"
                  label="Dashboard"
                  icon={LayoutDashboard}
                  onClick={() => setMobileOpen(false)}
                />
              </SidebarSection>

              <SidebarSection title="Workspaces">
                <SidebarItem
                  href="/history"
                  label="History"
                  icon={History}
                  onClick={() => setMobileOpen(false)}
                />
                <SidebarItem
                  href="/favorites"
                  label="Favorites"
                  icon={Heart}
                  onClick={() => setMobileOpen(false)}
                />
                <SidebarItem
                  href="/batch"
                  label="Batch Downloads"
                  icon={Layers}
                  onClick={() => setMobileOpen(false)}
                />
                <SidebarItem
                  href="/playlist"
                  label="Playlist"
                  icon={ListMusic}
                  onClick={() => setMobileOpen(false)}
                />
              </SidebarSection>

              <SidebarSection title="Platform">
                <SidebarItem
                  href="/developer"
                  label="Developer API"
                  icon={Code}
                  onClick={() => setMobileOpen(false)}
                />
                <SidebarItem
                  href="/orgs/default"
                  label="SaaS Portal"
                  icon={Building}
                  onClick={() => setMobileOpen(false)}
                />
                <SidebarItem
                  href="/settings"
                  label="Settings"
                  icon={Settings}
                  onClick={() => setMobileOpen(false)}
                />
              </SidebarSection>
            </div>

            {/* Footer */}
            <SidebarFooter />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
