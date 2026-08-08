'use client';

import React, { useState } from 'react';
import { useDownload } from '../../context/DownloadContext';
import { DownloadProgressPanel } from '../media/DownloadProgressPanel';
import { ArrowDownToLine, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function HeaderDownloadIndicator() {
  const { activeJob } = useDownload();
  const [showPopover, setShowPopover] = useState(false);

  if (!activeJob) return null;

  const isProcessing =
    activeJob.stage === 'PREPARING' ||
    activeJob.stage === 'DOWNLOADING_SOURCE' ||
    activeJob.stage === 'CONVERTING_FFMPEG' ||
    activeJob.stage === 'STREAMING';

  return (
    <div className="relative">
      <button
        onClick={() => setShowPopover(!showPopover)}
        className={`flex items-center gap-2 h-9 px-3 rounded-xl border text-xs font-semibold transition-all duration-200 shadow-md ${
          isProcessing
            ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-200 ring-1 ring-indigo-500/30'
            : activeJob.stage === 'SUCCESS'
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
            : 'bg-slate-900 border-white/10 text-slate-300'
        }`}
      >
        {isProcessing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
        ) : activeJob.stage === 'SUCCESS' ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        )}
        <span className="truncate max-w-[120px] sm:max-w-[180px]">
          {isProcessing
            ? activeJob.stage === 'CONVERTING_FFMPEG'
              ? 'Converting...'
              : 'Downloading...'
            : activeJob.stage === 'SUCCESS'
            ? 'Download Complete'
            : 'Download Status'}
        </span>
        <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0">
          .{activeJob.ext}
        </span>
      </button>

      {showPopover && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50 animate-in fade-in slide-in-from-top-2 shadow-2xl">
          <DownloadProgressPanel onDismiss={() => setShowPopover(false)} />
        </div>
      )}
    </div>
  );
}
