'use client';

import React from 'react';
import { useDownload, ActiveDownloadJob } from '../../context/DownloadContext';
import {
  Loader2,
  RefreshCw,
  Check,
  AlertCircle,
  XCircle,
  X,
} from 'lucide-react';
import { formatBytes } from '@mediahub/utils';

interface DownloadProgressPanelProps {
  job?: ActiveDownloadJob | null;
  onDismiss?: () => void;
}

export function DownloadProgressPanel({ job: propJob, onDismiss }: DownloadProgressPanelProps) {
  const { activeJob, cancelDownload, clearActiveJob } = useDownload();
  const job = propJob || activeJob;

  if (!job || job.stage === 'IDLE') return null;

  const isProcessing =
    job.stage === 'PREPARING' ||
    job.stage === 'DOWNLOADING_SOURCE' ||
    job.stage === 'CONVERTING_FFMPEG' ||
    job.stage === 'STREAMING';

  const isSuccess = job.stage === 'SUCCESS';
  const isFailed = job.stage === 'FAILED';
  const isCancelled = job.stage === 'CANCELLED';

  const handleDismiss = () => {
    if (onDismiss) onDismiss();
    clearActiveJob();
  };

  return (
    <div className="w-full bg-[#1c1e22] border border-[#2a2d32] rounded-lg p-4 space-y-4 text-[#f2f3f5] text-xs shadow-lg transition-all">
      {/* Header Status Bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-[#121316] border border-[#2a2d32] shrink-0">
            {isProcessing ? (
              job.stage === 'CONVERTING_FFMPEG' ? (
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              )
            ) : isSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : isFailed ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#9a9da5]" />
            )}
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-[#f2f3f5] truncate flex items-center gap-2">
              {isProcessing
                ? job.stage === 'CONVERTING_FFMPEG'
                  ? 'Converting media'
                  : 'Downloading media'
                : isSuccess
                ? 'Download complete'
                : isFailed
                ? 'Download failed'
                : 'Download cancelled'}
            </h4>
            <p className="text-[11px] text-[#9a9da5] truncate mt-0.5">{job.title}</p>
          </div>
        </div>

        {(isSuccess || isFailed || isCancelled) && (
          <button
            onClick={handleDismiss}
            aria-label="Dismiss notice"
            className="text-[#9a9da5] hover:text-[#f2f3f5] p-1 rounded hover:bg-[#22252a] transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Progress Indicator for Active Processing */}
      {isProcessing && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-[#9a9da5] font-mono">
            <span>{job.stageMessage}</span>
            <span>{job.estimatedSize ? `Est. ${job.estimatedSize}` : ''}</span>
          </div>

          <div className="relative w-full h-1.5 rounded-full bg-[#121316] overflow-hidden border border-[#2a2d32]">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500/30 via-indigo-500 to-indigo-500/30 animate-shimmer rounded-full" />
          </div>
        </div>
      )}

      {/* Structured Technical Metadata Summary */}
      <div className="grid grid-cols-3 gap-2 bg-[#121316] p-2.5 rounded border border-[#2a2d32] font-mono text-[11px] text-[#9a9da5]">
        <div>
          <span className="text-[#6f737d] block text-[10px]">Format</span>
          <span className="text-[#f2f3f5] font-medium">{job.formatLabel}</span>
        </div>
        <div>
          <span className="text-[#6f737d] block text-[10px]">Container</span>
          <span className="text-[#f2f3f5] font-medium">.{job.ext.toUpperCase()}</span>
        </div>
        <div>
          <span className="text-[#6f737d] block text-[10px]">Pipeline</span>
          <span className="text-[#9a9da5] font-medium">{job.requiresConversion ? 'FFmpeg Transcode' : 'Direct Stream'}</span>
        </div>
      </div>

      {/* Error Details */}
      {isFailed && job.error && (
        <div className="p-2.5 rounded bg-rose-950/30 border border-rose-500/20 text-[11px] text-rose-300 space-y-0.5">
          <span className="font-semibold text-rose-200 block">Reason</span>
          <p className="opacity-90">{job.error}</p>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-[#2a2d32]">
        {isProcessing ? (
          <>
            <span className="text-[11px] text-[#9a9da5] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Processing stream...
            </span>
            <button
              onClick={cancelDownload}
              className="px-3 py-1 rounded bg-[#22252a] hover:bg-[#2a2d32] text-[#f2f3f5] border border-[#2a2d32] text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          </>
        ) : isSuccess ? (
          <>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Saved to Downloads ({job.finalSize ? formatBytes(job.finalSize) : 'Complete'})
            </span>
            <button
              onClick={handleDismiss}
              className="px-3 py-1 rounded bg-[#22252a] hover:bg-[#2a2d32] text-[#f2f3f5] border border-[#2a2d32] text-xs font-medium transition-colors"
            >
              Dismiss
            </button>
          </>
        ) : (
          <div className="w-full flex justify-end">
            <button
              onClick={handleDismiss}
              className="px-3 py-1 rounded bg-[#22252a] hover:bg-[#2a2d32] text-[#f2f3f5] border border-[#2a2d32] text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
