import React from 'react';
import { PlatformType } from '@mediahub/types';
import { Youtube, Music, Instagram, Twitter, Video, Share2, Globe } from 'lucide-react';

interface PlatformBadgeProps {
  platform: PlatformType;
}

export function PlatformBadge({ platform }: PlatformBadgeProps) {
  const configs: Record<PlatformType, { label: string; icon: React.ReactNode }> = {
    YOUTUBE: { label: 'YouTube', icon: <Youtube className="w-3 h-3 text-red-400" /> },
    YOUTUBE_MUSIC: { label: 'YouTube Music', icon: <Music className="w-3 h-3 text-rose-400" /> },
    INSTAGRAM: { label: 'Instagram', icon: <Instagram className="w-3 h-3 text-pink-400" /> },
    X: { label: 'X (Twitter)', icon: <Twitter className="w-3 h-3 text-slate-300" /> },
    REDDIT: { label: 'Reddit', icon: <Share2 className="w-3 h-3 text-orange-400" /> },
    TIKTOK: { label: 'TikTok', icon: <Video className="w-3 h-3 text-cyan-400" /> },
    FACEBOOK: { label: 'Facebook', icon: <Share2 className="w-3 h-3 text-blue-400" /> },
    VIMEO: { label: 'Vimeo', icon: <Video className="w-3 h-3 text-sky-400" /> },
    THREADS: { label: 'Threads', icon: <Share2 className="w-3 h-3 text-purple-400" /> },
    PINTEREST: { label: 'Pinterest', icon: <Share2 className="w-3 h-3 text-red-400" /> },
    UNKNOWN: { label: 'Universal', icon: <Globe className="w-3 h-3 text-slate-400" /> },
  };

  const config = configs[platform] || configs.UNKNOWN;

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300 text-[11px] font-medium font-mono">
      {config.icon}
      {config.label}
    </span>
  );
}
