'use client';

import React, { useState } from 'react';
import { ApiService } from '../../services/api.service';
import { PlaylistMetadata, PlaylistItemData } from '@mediahub/types';
import { ListVideo, Search, CheckSquare, Square, Download, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export default function PlaylistPage() {
  const { addToast } = useNotification();
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistMetadata | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  const handleAnalyzePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;

    setLoading(true);
    try {
      const data = await ApiService.analyzePlaylist(playlistUrl);
      setPlaylist(data);
      const initialMap: Record<string, boolean> = {};
      data.items.forEach((item) => { initialMap[item.id] = true; });
      setSelectedItems(initialMap);
      addToast({ type: 'success', title: 'Playlist Extracted', message: `Found ${data.videoCount} videos in playlist.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Playlist Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (!playlist) return;
    const allSelected = playlist.items.every((i) => selectedItems[i.id]);
    const updated: Record<string, boolean> = {};
    playlist.items.forEach((i) => { updated[i.id] = !allSelected; });
    setSelectedItems(updated);
  };

  const handleQueuePlaylist = async () => {
    if (!playlist) return;
    const chosen = playlist.items.filter((i) => selectedItems[i.id]);
    if (chosen.length === 0) {
      addToast({ type: 'error', title: 'Selection Error', message: 'Select at least one video to download.' });
      return;
    }

    try {
      await ApiService.enqueueBatch(chosen.map((c) => ({ url: c.rawUrl, formatId: 'best' })));
      addToast({ type: 'success', title: 'Playlist Queued', message: `Enqueued ${chosen.length} playlist videos.` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Queue Error', message: err.message });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">YouTube Playlist Downloader</h1>
        <p className="text-xs sm:text-sm text-slate-400">Extract entire YouTube playlists, inspect video counts, and download full playlists or custom video selections.</p>
      </div>

      {/* Input */}
      <form onSubmit={handleAnalyzePlaylist} className="glass-panel p-4 rounded-2xl flex items-center gap-3">
        <ListVideo className="w-5 h-5 text-indigo-400 ml-2" />
        <input
          type="url"
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
          placeholder="Paste YouTube playlist URL (e.g. https://www.youtube.com/playlist?list=...)"
          disabled={loading}
          className="w-full bg-transparent text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !playlistUrl.trim()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 shrink-0 disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span>Analyze Playlist</span>
        </button>
      </form>

      {/* Playlist Content */}
      {playlist && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">{playlist.title}</h2>
              <p className="text-xs text-slate-400">{playlist.videoCount} Videos • Estimated Size: ~{(playlist.videoCount * 25).toFixed(0)} MB</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20"
              >
                Toggle Select All
              </button>

              <button
                onClick={handleQueuePlaylist}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/30"
              >
                <Download className="w-4 h-4" />
                <span>Download Selected ({Object.values(selectedItems).filter(Boolean).length})</span>
              </button>
            </div>
          </div>

          {/* Videos Grid */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {playlist.items.map((item) => {
              const isChecked = !!selectedItems[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItems((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked ? 'bg-indigo-950/40 border-indigo-500/50 text-white' : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    {isChecked ? <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" /> : <Square className="w-4 h-4 text-slate-600 shrink-0" />}
                    <span className="text-xs font-mono text-slate-500 shrink-0">#{item.position}</span>
                    <span className="text-xs font-semibold truncate">{item.title}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
