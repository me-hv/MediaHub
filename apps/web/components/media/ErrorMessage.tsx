import React from 'react';
import { AlertTriangle, RefreshCw, Lock, ShieldAlert } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  isRateLimit?: boolean;
}

export function ErrorMessage({ message, onRetry, isRateLimit }: ErrorMessageProps) {
  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl bg-rose-950/40 border border-rose-500/30 p-5 text-rose-200 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start justify-between gap-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
          {isRateLimit ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-bold text-rose-100 flex items-center gap-2">
            {isRateLimit ? 'Instagram Limit Encountered' : 'Analysis Notice'}
          </p>
          <p className="text-rose-300/90 leading-relaxed text-xs sm:text-sm">{message}</p>
          {isRateLimit && (
            <p className="text-[11px] text-rose-400/80 pt-1">
              Tip: Cached Reel results will load instantly. You can also configure Instagram cookies in platform settings.
            </p>
          )}
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 font-medium text-xs px-4 py-2 rounded-xl transition-all shrink-0 self-end sm:self-center shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Analysis</span>
        </button>
      )}
    </div>
  );
}
