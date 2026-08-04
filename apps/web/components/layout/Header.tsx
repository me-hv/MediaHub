'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, LayoutDashboard, History, Bookmark, Layers3, ListVideo, Settings, Code2, Building2, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Header() {
  const pathname = usePathname();
  const { user, signInWithGoogle, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = [
    { label: 'Downloader', href: '/', icon: <Layers className="w-4 h-4" /> },
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'History', href: '/history', icon: <History className="w-4 h-4" /> },
    { label: 'Favorites', href: '/favorites', icon: <Bookmark className="w-4 h-4" /> },
    { label: 'Batch', href: '/batch', icon: <Layers3 className="w-4 h-4" /> },
    { label: 'Playlist', href: '/playlist', icon: <ListVideo className="w-4 h-4" /> },
    { label: 'Developer', href: '/developer', icon: <Code2 className="w-4 h-4" /> },
    { label: 'SaaS Portal', href: '/orgs/acme-media', icon: <Building2 className="w-4 h-4" /> },
    { label: 'Settings', href: '/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/20">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white hidden sm:inline">
            Media<span className="text-indigo-400">Hub</span>
          </span>
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href.startsWith('/orgs') && pathname.startsWith('/orgs'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Auth / Profile */}
        <div className="relative flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 border border-white/10 p-1.5 rounded-full hover:border-indigo-500/50 transition-all bg-slate-900"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white font-bold">
                    {user.email[0].toUpperCase()}
                  </div>
                )}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl p-2 border border-white/10 shadow-2xl z-50 text-xs animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 border-b border-white/10">
                    <p className="font-semibold text-white">{user.displayName || 'User'}</p>
                    <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors mt-1 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
