'use client';

import React, { useState } from 'react';
import { useDownload } from '../../context/DownloadContext';
import { DownloadProgressPanel } from '../media/DownloadProgressPanel';
import { Loader2, Check, AlertCircle } from 'lucide-react';

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
        className="flex items-center gap-2 h-8 px-2.5 rounded bg-[#0d0f14] hover:bg-[#13161c] border border-white/10 text-xs font-medium text-slate-300 transition-colors shadow-sm"
      >
        {isProcessing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
        ) : activeJob.stage === 'SUCCESS' ? (
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        )}
        <span className="truncate max-w-[110px] sm:max-w-[160px]">
          {isProcessing
            ? activeJob.stage === 'CONVERTING_FFMPEG'
              ? 'Converting...'
              : 'Downloading...'
            : activeJob.stage === 'SUCCESS'
            ? 'Download Complete'
            : 'Download Status'}
        </span>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded shrink-0 uppercase">
          .{activeJob.ext}
        </span>
      </button>

      {showPopover && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50 animate-in fade-in slide-in-from-top-2 shadow-xl">
          <DownloadProgressPanel onDismiss={() => setShowPopover(false)} />
        </div>
      )}
    </div>
  );
}
