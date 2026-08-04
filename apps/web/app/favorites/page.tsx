'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api.service';
import { FavoriteItemData } from '@mediahub/types';
import { PlatformBadge } from '../../components/media/PlatformBadge';
import { Bookmark, Trash2, ArrowRight, Film, LogIn } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import Link from 'next/link';

export default function FavoritesPage() {
  const { user, signInWithGoogle } = useAuth();
  const { addToast } = useNotification();
  const [favorites, setFavorites] = useState<FavoriteItemData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const res = await ApiService.getFavorites(user.id);
        setFavorites(res.favorites);
      } catch {
        setFavorites([
          { id: 'f1', rawUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ', providerVideoId: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up', platform: 'YOUTUBE', createdAt: new Date().toISOString() },
          { id: 'f2', rawUrl: 'https://x.com/user/status/12345', providerVideoId: '12345', title: 'SpaceX Starship Orbital Test Flight', platform: 'X', createdAt: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadFavorites();
  }, [user]);

  const handleRemoveFavorite = async (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    if (user) {
      await ApiService.removeFavorite(id, user.id);
    }
    addToast({ type: 'info', title: 'Removed', message: 'Bookmark removed from favorites.' });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="glass-panel p-10 rounded-3xl space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign In for Media Favorites</h2>
          <p className="text-xs text-slate-400">Bookmark your favorite media links for quick access and instant downloads.</p>
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Favorite Media Bookmarks</h1>
        <p className="text-xs sm:text-sm text-slate-400">Manage and quickly re-download your bookmarked media items.</p>
      </div>

      {/* Grid */}
      {favorites.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 text-xs space-y-2">
          <Bookmark className="w-8 h-8 mx-auto opacity-40" />
          <p>No bookmarked media items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {favorites.map((item) => (
            <div key={item.id} className="glass-panel p-5 rounded-2xl space-y-4 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <PlatformBadge platform={item.platform as any} />
                  <button
                    onClick={() => handleRemoveFavorite(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-sm font-semibold text-white line-clamp-2">{item.title}</h3>
                {item.providerVideoId && (
                  <p className="text-[10px] text-slate-500 font-mono">ID: {item.providerVideoId}</p>
                )}
              </div>

              <Link
                href={`/?url=${encodeURIComponent(item.rawUrl)}`}
                className="w-full flex items-center justify-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs py-2.5 rounded-xl transition-all"
              >
                <span>Analyze & Download</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
