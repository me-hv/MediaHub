import React from 'react';
import { PlatformType } from '@mediahub/types';
import { Youtube, Music, Instagram, Twitter, Video, Share2, Globe } from 'lucide-react';

interface PlatformBadgeProps {
  platform: PlatformType;
}

export function PlatformBadge({ platform }: PlatformBadgeProps) {
  const configs: Record<PlatformType, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
    YOUTUBE: { label: 'YouTube', icon: <Youtube className="w-3.5 h-3.5" />, bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    YOUTUBE_MUSIC: { label: 'YouTube Music', icon: <Music className="w-3.5 h-3.5" />, bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    INSTAGRAM: { label: 'Instagram', icon: <Instagram className="w-3.5 h-3.5" />, bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
    X: { label: 'X (Twitter)', icon: <Twitter className="w-3.5 h-3.5" />, bg: 'bg-slate-500/10', text: 'text-slate-300', border: 'border-slate-500/20' },
    REDDIT: { label: 'Reddit', icon: <Share2 className="w-3.5 h-3.5" />, bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    TIKTOK: { label: 'TikTok', icon: <Video className="w-3.5 h-3.5" />, bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    FACEBOOK: { label: 'Facebook', icon: <Share2 className="w-3.5 h-3.5" />, bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    VIMEO: { label: 'Vimeo', icon: <Video className="w-3.5 h-3.5" />, bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
    THREADS: { label: 'Threads', icon: <Share2 className="w-3.5 h-3.5" />, bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    PINTEREST: { label: 'Pinterest', icon: <Share2 className="w-3.5 h-3.5" />, bg: 'bg-red-600/10', text: 'text-red-500', border: 'border-red-600/20' },
    UNKNOWN: { label: 'Universal', icon: <Globe className="w-3.5 h-3.5" />, bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  };

  const config = configs[platform] || configs.UNKNOWN;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} transition-all duration-300`}>
      {config.icon}
      {config.label}
    </span>
  );
}
