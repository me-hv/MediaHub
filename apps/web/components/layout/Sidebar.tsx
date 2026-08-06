'use client';

import React from 'react';
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
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { SidebarHeader } from './SidebarHeader';
import { SidebarSection } from './SidebarSection';
import { SidebarItem } from './SidebarItem';
import { SidebarFooter } from './SidebarFooter';
import { motion } from 'framer-motion';

export function Sidebar() {
  const { collapsed } = useSidebar();

  return (
    <motion.aside
      initial={false}
      animate={{
        width: collapsed ? 72 : 260,
      }}
      transition={{
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="hidden lg:flex flex-col h-screen sticky top-0 bg-slate-950/90 backdrop-blur-xl border-r border-white/10 z-30 shrink-0 select-none overflow-hidden"
    >
      {/* Top Header & Brand */}
      <SidebarHeader />

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 custom-scrollbar">
        {/* Core Tools */}
        <SidebarSection title="Core Tools">
          <SidebarItem
            href="/"
            label="Downloader"
            icon={ArrowDownCircle}
            shortcut="⌘1"
          />
          <SidebarItem
            href="/dashboard"
            label="Dashboard"
            icon={LayoutDashboard}
            shortcut="⌘2"
          />
        </SidebarSection>

        {/* Media Workspaces */}
        <SidebarSection title="Workspaces">
          <SidebarItem
            href="/history"
            label="History"
            icon={History}
            shortcut="⌘3"
          />
          <SidebarItem
            href="/favorites"
            label="Favorites"
            icon={Heart}
          />
          <SidebarItem
            href="/batch"
            label="Batch Downloads"
            icon={Layers}
          />
          <SidebarItem
            href="/playlist"
            label="Playlist"
            icon={ListMusic}
          />
        </SidebarSection>

        {/* Platform & Developer */}
        <SidebarSection title="Platform">
          <SidebarItem
            href="/developer"
            label="Developer API"
            icon={Code}
          />
          <SidebarItem
            href="/orgs/default"
            label="SaaS Portal"
            icon={Building}
          />
          <SidebarItem
            href="/settings"
            label="Settings"
            icon={Settings}
          />
        </SidebarSection>
      </div>

      {/* Sidebar Footer with Storage & User Card */}
      <SidebarFooter />
    </motion.aside>
  );
}
