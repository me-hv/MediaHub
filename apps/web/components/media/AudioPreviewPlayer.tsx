'use client';

import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

interface AudioPreviewPlayerProps {
  title: string;
  artist?: string;
  previewUrl?: string;
}

export function AudioPreviewPlayer({ title, artist, previewUrl }: AudioPreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current && previewUrl) {
      const audio = new Audio(previewUrl);
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      audio.onended = () => setIsPlaying(false);
      audioRef.current = audio;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    } else {
      // Simulation mode if no direct stream URL
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-3.5 flex items-center justify-between gap-4 backdrop-blur-md shadow-lg">
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-indigo-600/30"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <div>
          <p className="text-xs font-bold text-white flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-indigo-400" />
            <span className="line-clamp-1">{title}</span>
          </p>
          <p className="text-[10px] text-slate-400">{artist || 'YouTube Music Stream Preview (30s)'}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-1 max-w-xs">
        <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors">
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
