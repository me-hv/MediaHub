'use client';

import React, { useState, useEffect, useRef } from 'react';
import { detectPlatform, sanitizeAndValidateUrl } from '@mediahub/utils';
import { PlatformBadge } from './PlatformBadge';
import { Search, ArrowRight, Loader2, Clipboard } from 'lucide-react';

interface UrlInputFormProps {
  onAnalyze: (options: { url: string; source: 'Paste' | 'Analyze Button' | 'Enter Key' | 'Auto' }) => void;
  isLoading: boolean;
}

export function UrlInputForm({ onAnalyze, isLoading }: UrlInputFormProps) {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const lastSubmittedUrlRef = useRef<string>('');

  const platform = detectPlatform(url);

  // 1. Explicit Paste Handler
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

  // 2. Debounced typing handler (triggers only when user stops typing for 600ms)
  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed || trimmed === lastSubmittedUrlRef.current || isLoading) return;

    const timer = setTimeout(() => {
      const val = sanitizeAndValidateUrl(trimmed);
      if (val.success) {
        setValidationError(null);
        lastSubmittedUrlRef.current = val.url;
        onAnalyze({ url: val.url, source: 'Auto' });
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [url, isLoading, onAnalyze]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    if (validationError) setValidationError(null);
  };

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
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-3">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
        <div className="relative flex items-center bg-slate-950/90 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl">
          <div className="pl-3 pr-2 text-slate-400">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={url}
            onChange={handleChange}
            onPaste={handlePaste}
            placeholder="Paste a media link (YouTube, Instagram, X, TikTok, Reddit...)"
            disabled={isLoading}
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none px-2 py-3 disabled:opacity-50"
          />

          {url.trim() && (
            <div className="hidden sm:block mr-2">
              <PlatformBadge platform={platform} />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-medium text-sm px-5 py-3 rounded-xl transition-all duration-200 shrink-0 shadow-lg shadow-indigo-600/30"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {validationError && (
        <p className="text-xs text-rose-400 pl-4 font-medium animate-in fade-in slide-in-from-top-1">
          {validationError}
        </p>
      )}

      <div className="flex items-center justify-between px-2 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Clipboard className="w-3 h-3" /> Auto-detects YouTube, Instagram, X, TikTok, Reddit, Facebook...
        </span>
        <div className="flex gap-3">
          <span>YouTube</span>
          <span>Instagram</span>
          <span>X / Twitter</span>
          <span>TikTok</span>
          <span>Reddit</span>
        </div>
      </div>
    </form>
  );
}
