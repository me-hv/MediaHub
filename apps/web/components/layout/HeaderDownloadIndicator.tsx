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
        className="flex items-center gap-2 h-9 px-3 rounded-md bg-[#1c1e22] hover:bg-[#22252a] border border-[#2a2d32] text-xs font-medium text-[#f2f3f5] transition-colors shadow-sm"
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
        <span className="text-[10px] font-mono text-[#9a9da5] bg-[#121316] px-1.5 py-0.2 rounded shrink-0 uppercase border border-[#2a2d32]">
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
