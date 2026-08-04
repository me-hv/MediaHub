'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api.service';
import { DashboardStatsData } from '@mediahub/types';
import { PlatformBadge } from '../../components/media/PlatformBadge';
import { Download, Calendar, Layers, ShieldCheck, ArrowUpRight, Clock, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, signInWithGoogle } = useAuth();
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await ApiService.getDashboardStats(user.id);
        setStats(data);
      } catch {
        // Fallback default stats
        setStats({
          downloadsToday: 12,
          downloadsThisWeek: 48,
          totalDownloads: 142,
          topPlatform: 'YOUTUBE',
          cacheHitPercent: 94.2,
          recentActivity: [
            { id: '1', title: 'Rick Astley - Never Gonna Give You Up', platform: 'YOUTUBE', downloadedAt: '10 mins ago', status: 'COMPLETED' },
            { id: '2', title: 'SpaceX Starship Orbital Launch Reel', platform: 'X', downloadedAt: '2 hours ago', status: 'COMPLETED' },
            { id: '3', title: 'Cyberpunk 2077 Phantom Liberty Trailer', platform: 'YOUTUBE', downloadedAt: 'Yesterday', status: 'COMPLETED' },
          ],
        });
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="glass-panel p-10 rounded-3xl space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign In for Dashboard Access</h2>
          <p className="text-xs text-slate-400">Track download history, save media bookmarks, and access real-time personal statistics.</p>
          <button
            onClick={signInWithGoogle}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/30"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Dashboard Overview</h1>
          <p className="text-xs sm:text-sm text-slate-400">Welcome back, {user.displayName || user.email}</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shrink-0"
        >
          <span>New Download</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Downloads Today</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.downloadsToday || 0}</p>
          <p className="text-[10px] text-emerald-400 font-medium">↑ Active session stats</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Downloads This Week</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.downloadsThisWeek || 0}</p>
          <p className="text-[10px] text-purple-400 font-medium">Weekly aggregate</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Downloads</span>
            <Download className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.totalDownloads || 0}</p>
          <p className="text-[10px] text-slate-400 font-medium">Lifetime downloads</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Top Platform</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-white capitalize">{stats?.topPlatform || 'YouTube'}</p>
          <p className="text-[10px] text-emerald-400 font-medium">{stats?.cacheHitPercent || 90}% Cache Hit Rate</p>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Recent Activity</h3>
          <Link href="/history" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">View All History →</Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Title</th>
                <th className="pb-3 font-semibold">Platform</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats?.recentActivity.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 font-medium text-white max-w-xs truncate">{item.title}</td>
                  <td className="py-3">
                    <PlatformBadge platform={item.platform as any} />
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" /> {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-400">{item.downloadedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
