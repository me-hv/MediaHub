'use client';

import React from 'react';
import { useDownload, ActiveDownloadJob } from '../../context/DownloadContext';
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileAudio,
  Film,
  Download,
  X,
  Sparkles,
  ArrowDownToLine,
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
    <div
      className={`w-full rounded-2xl p-5 border transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
        isSuccess
          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100 shadow-emerald-950/20 shadow-xl'
          : isFailed
          ? 'bg-rose-950/40 border-rose-500/40 text-rose-100 shadow-rose-950/20 shadow-xl'
          : isCancelled
          ? 'bg-slate-900/90 border-white/10 text-slate-300 shadow-xl'
          : 'bg-slate-900/95 border-indigo-500/40 text-slate-100 shadow-indigo-950/30 shadow-2xl backdrop-blur-xl'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`p-2.5 rounded-xl border shrink-0 ${
              isSuccess
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : isFailed
                ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                : isCancelled
                ? 'bg-slate-800 border-white/10 text-slate-400'
                : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
            }`}
          >
            {isProcessing ? (
              job.stage === 'CONVERTING_FFMPEG' ? (
                <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              )
            ) : isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : isFailed ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : (
              <XCircle className="w-5 h-5 text-slate-400" />
            )}
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                  job.requiresConversion
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                }`}
              >
                {job.formatLabel}
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-white/10 uppercase">
                .{job.ext}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white truncate leading-snug">{job.title}</h4>
          </div>
        </div>

        {/* Dismiss Button for completed states */}
        {(isSuccess || isFailed || isCancelled) && (
          <button
            onClick={handleDismiss}
            aria-label="Close status panel"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stage Status Announcement */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            {job.stage === 'CONVERTING_FFMPEG' && <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />}
            {job.stage === 'DOWNLOADING_SOURCE' && <ArrowDownToLine className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />}
            {job.stageMessage}
          </span>
          {job.estimatedSize && (
            <span className="text-[11px] font-mono text-slate-400">Est. {job.estimatedSize}</span>
          )}
        </div>

        {/* Shimmer Progressbar */}
        <div className="relative w-full h-2.5 rounded-full bg-slate-950/80 border border-white/10 overflow-hidden">
          {isProcessing ? (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 animate-shimmer rounded-full" />
          ) : isSuccess ? (
            <div className="w-full h-full bg-emerald-500 rounded-full transition-all duration-500" />
          ) : isFailed ? (
            <div className="w-full h-full bg-rose-500 rounded-full" />
          ) : (
            <div className="w-0 h-full bg-slate-700 rounded-full" />
          )}
        </div>
      </div>

      {/* Detailed Technical Format & Stage Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4 text-[11px] font-mono bg-slate-950/60 p-3 rounded-xl border border-white/5 text-slate-400">
        <div>
          Format: <span className="text-white font-semibold">{job.formatLabel}</span>
        </div>
        <div>
          Container: <span className="text-white font-semibold">.{job.ext.toUpperCase()}</span>
        </div>
        <div>
          Pipeline: <span className="text-indigo-300 font-semibold">{job.requiresConversion ? 'FFmpeg Transcode' : 'Direct Stream'}</span>
        </div>
      </div>

      {/* Error Details */}
      {isFailed && job.error && (
        <div className="mb-4 text-xs text-rose-300 bg-rose-950/80 p-3 rounded-xl border border-rose-500/30 space-y-1">
          <p className="font-bold flex items-center gap-1 text-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Transcode Error Notice
          </p>
          <p className="text-[11px] leading-relaxed opacity-90">{job.error}</p>
        </div>
      )}

      {/* Control Actions */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {isProcessing ? (
          <>
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-900/40 text-indigo-200 border border-indigo-500/30 font-medium text-xs py-2.5 px-4 rounded-xl cursor-not-allowed opacity-80"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>
                {job.stage === 'CONVERTING_FFMPEG'
                  ? 'Converting with FFmpeg...'
                  : job.stage === 'DOWNLOADING_SOURCE'
                  ? 'Downloading Source...'
                  : 'Processing Download...'}
              </span>
            </button>
            <button
              onClick={cancelDownload}
              className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 font-semibold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shrink-0"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </>
        ) : isSuccess ? (
          <div className="w-full flex items-center justify-between gap-3">
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              File ready ({job.finalSize ? formatBytes(job.finalSize) : 'Saved'})
            </span>
            <button
              onClick={handleDismiss}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            >
              Dismiss Notice
            </button>
          </div>
        ) : (
          <div className="w-full flex justify-end">
            <button
              onClick={handleDismiss}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-4 py-2 rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
