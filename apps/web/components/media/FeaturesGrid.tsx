import React from 'react';
import { ShieldCheck, Zap, Layers, Cpu, Database, HardDrive } from 'lucide-react';

export function FeaturesGrid() {
  const features = [
    {
      icon: <Zap className="w-5 h-5 text-indigo-400" />,
      title: 'Decoupled Downloader Engine',
      desc: 'Powered by a modular Provider/Factory architecture wrapping yt-dlp with zero local file persistence.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      title: 'SSRF & Input Sanitized',
      desc: 'Strict Zod verification blocking local network probes, invalid schemes, and non-public hostnames.',
    },
    {
      icon: <Layers className="w-5 h-5 text-violet-400" />,
      title: 'Hono High Performance API',
      desc: 'Built on Hono framework with sliding window rate limiting, Pino logging, and request tracing.',
    },
    {
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      title: 'Stream Directing & Abortable',
      desc: 'Direct binary streaming from engine to client browser with real-time AbortController cancellation.',
    },
    {
      icon: <Database className="w-5 h-5 text-amber-400" />,
      title: 'Indexed SHA-256 Cache',
      desc: 'PostgreSQL cache indexed by URL hash with 6-hour TTL to eliminate redundant metadata fetching.',
    },
    {
      icon: <HardDrive className="w-5 h-5 text-rose-400" />,
      title: 'Enterprise Future Ready',
      desc: 'Decoupled monorepo architecture ready for Auth, Redis Queues, S3 Cloud Storage, and Admin Dashboards.',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto pt-16 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-white tracking-tight">Built for Scale & Precision</h2>
        <p className="text-xs sm:text-sm text-text-muted">Architected from day one as a production-grade universal media engine.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {features.map((feat, idx) => (
          <div key={idx} className="glass-panel p-5 rounded-2xl space-y-2 hover:border-indigo-500/30 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5">
              {feat.icon}
            </div>
            <h4 className="text-sm font-semibold text-white">{feat.title}</h4>
            <p className="text-xs text-text-muted leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
