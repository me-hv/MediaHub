'use client';

import React, { useState } from 'react';
import { Disc, CheckSquare, Square, Download, Clock, Music } from 'lucide-react';
import { formatDuration } from '@mediahub/utils';

export interface AlbumTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  trackNumber: number;
}

interface AlbumTrackListProps {
  albumTitle: string;
  artist: string;
  tracks: AlbumTrack[];
  onDownloadZip: (selectedTrackIds: string[]) => void;
}

export function AlbumTrackList({ albumTitle, artist, tracks, onDownloadZip }: AlbumTrackListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(tracks.map((t) => t.id)));

  const toggleTrack = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tracks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tracks.map((t) => t.id)));
    }
  };

  return (
    <div className="bg-slate-950/80 rounded-2xl p-5 border border-white/10 space-y-4 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <Disc className="w-5 h-5 text-purple-400 animate-spin-slow" />
            <span>{albumTitle}</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">{artist} • {tracks.length} Tracks</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="text-xs text-slate-400 hover:text-white bg-slate-900 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
          >
            {selectedIds.size === tracks.length ? 'Deselect All' : 'Select All'}
          </button>

          <button
            onClick={() => onDownloadZip(Array.from(selectedIds))}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-lg shadow-purple-600/30 transition-all disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Download Selected ({selectedIds.size}) as ZIP</span>
          </button>
        </div>
      </div>

      <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
        {tracks.map((track) => {
          const isChecked = selectedIds.has(track.id);
          return (
            <div
              key={track.id}
              onClick={() => toggleTrack(track.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                isChecked ? 'bg-indigo-950/40 border-indigo-500/40 text-white' : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {isChecked ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                <span className="font-mono text-[11px] text-slate-500 w-5">{track.trackNumber.toString().padStart(2, '0')}</span>
                <span className="font-medium text-white">{track.title}</span>
              </div>

              <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                <Clock className="w-3 h-3 text-slate-600" />
                <span>{formatDuration(track.duration)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
