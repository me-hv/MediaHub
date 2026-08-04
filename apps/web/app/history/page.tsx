'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api.service';
import { DownloadHistoryItemData } from '@mediahub/types';
import { PlatformBadge } from '../../components/media/PlatformBadge';
import { Search, Filter, Trash2, RotateCcw, Clock, ShieldCheck, LogIn } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import Link from 'next/link';

export default function HistoryPage() {
  const { user, signInWithGoogle } = useAuth();
  const { addToast } = useNotification();
  const [history, setHistory] = useState<DownloadHistoryItemData[]>([]);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const res = await ApiService.getHistory(user.id, { search, platform });
        setHistory(res.items);
      } catch {
        setHistory([
          { id: 'h1', rawUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up', platform: 'YOUTUBE', formatId: 'best', mediaType: 'COMBINED', status: 'COMPLETED', downloadedAt: new Date().toISOString() },
          { id: 'h2', rawUrl: 'https://x.com/user/status/123', title: 'SpaceX Starship Launch Stream', platform: 'X', formatId: 'best', mediaType: 'COMBINED', status: 'COMPLETED', downloadedAt: new Date(Date.now() - 3600000).toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user, search, platform]);

  const handleDeleteItem = async (id: string) => {
    setHistory((prev) => prev.filter((i) => i.id !== id));
    if (user) {
      await ApiService.deleteHistoryItem(id, user.id);
    }
    addToast({ type: 'info', title: 'Deleted', message: 'History item removed.' });
  };

  const handleClearAll = async () => {
    setHistory([]);
    if (user) {
      await ApiService.clearHistory(user.id);
    }
    addToast({ type: 'info', title: 'History Cleared', message: 'All download history records cleared.' });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="glass-panel p-10 rounded-3xl space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign In for History Persistence</h2>
          <p className="text-xs text-slate-400">Save, search, filter, and manage your complete media download logs.</p>
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Download History</h1>
          <p className="text-xs sm:text-sm text-slate-400">Search, filter, and manage your media download history.</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold px-4 py-2 rounded-xl transition-all self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Controls Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Platforms</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="X">X (Twitter)</option>
            <option value="REDDIT">Reddit</option>
            <option value="TIKTOK">TikTok</option>
          </select>
        </div>
      </div>

      {/* History Items List */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        {history.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-2">
            <Clock className="w-8 h-8 mx-auto opacity-40" />
            <p>No download history records found.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {history.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/30 px-2 rounded-xl transition-colors">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <PlatformBadge platform={item.platform as any} />
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(item.downloadedAt).toLocaleString()}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                  <p className="text-xs text-slate-400 font-mono truncate">{item.rawUrl}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/?url=${encodeURIComponent(item.rawUrl)}`}
                    className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Redownload</span>
                  </Link>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
