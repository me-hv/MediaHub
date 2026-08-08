'use client';

import React, { useState, useRef } from 'react';
import { detectPlatform, sanitizeAndValidateUrl } from '@mediahub/utils';
import { PlatformBadge } from './PlatformBadge';
import { Search, ArrowRight, Loader2, Link as LinkIcon } from 'lucide-react';

interface UrlInputFormProps {
  onAnalyze: (options: { url: string; source: 'Paste' | 'Analyze Button' | 'Enter Key' | 'Auto' }) => void;
  isLoading: boolean;
}

export function UrlInputForm({ onAnalyze, isLoading }: UrlInputFormProps) {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const lastSubmittedUrlRef = useRef<string>('');

  const platform = detectPlatform(url);

  // Explicit Paste Handler
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const val = sanitizeAndValidateUrl(pastedText.trim());
    if (val.success && !isLoading) {
      setValidationError(null);
      setUrl(val.url);
      lastSubmittedUrlRef.current = val.url;
      onAnalyze({ url: val.url, source: 'Paste' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    if (validationError) setValidationError(null);
  };

  // Form Submission Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const val = sanitizeAndValidateUrl(url);
    if (!val.success) {
      setValidationError(val.error);
      return;
    }
    setValidationError(null);
    lastSubmittedUrlRef.current = val.url;
    onAnalyze({ url: val.url, source: 'Analyze Button' });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-2.5">
      <div className="relative flex items-center bg-[#0d0f14] border border-white/10 rounded-lg p-1.5 focus-within:border-indigo-500/50 transition-colors shadow-lg">
        <div className="pl-3 pr-2 text-slate-400">
          <Search className="w-4 h-4 text-slate-400" />
        </div>

        <input
          type="text"
          value={url}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder="Paste media URL (YouTube, Music, Instagram, X/Twitter, TikTok, Reddit...)"
          disabled={isLoading}
          className="w-full bg-transparent text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none px-2 py-2 disabled:opacity-50 font-sans"
        />

        {url.trim() && (
          <div className="hidden sm:block mr-2">
            <PlatformBadge platform={platform} />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-md transition-colors shrink-0 shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>Analyze</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {validationError && (
        <p className="text-xs text-rose-400 pl-3 font-medium">
          {validationError}
        </p>
      )}

      <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <LinkIcon className="w-3 h-3 text-slate-500" /> Auto-detects supported platform links
        </span>
        <div className="hidden sm:flex gap-2.5 text-slate-400 font-mono">
          <span>YouTube</span>
          <span>YouTube Music</span>
          <span>X / Twitter</span>
          <span>Instagram</span>
          <span>TikTok</span>
        </div>
      </div>
    </form>
  );
}
