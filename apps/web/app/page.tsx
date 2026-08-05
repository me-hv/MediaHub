'use client';

import React, { useState } from 'react';
import { useAnalyzeMedia, AnalyzeRequestOptions } from '../hooks/useAnalyzeMedia';
import { UrlInputForm } from '../components/media/UrlInputForm';
import { SkeletonCard } from '../components/media/SkeletonCard';
import { MetadataCard } from '../components/media/MetadataCard';
import { ErrorMessage } from '../components/media/ErrorMessage';
import { FeaturesGrid } from '../components/media/FeaturesGrid';
import { AlertCircle } from 'lucide-react';

export default function HomePage() {
  const { analyze, isPending, isSuccess, isError, metadata, error, warningNotice } = useAnalyzeMedia();
  const [currentUrl, setCurrentUrl] = useState<string>('');

  const handleAnalyze = (options: { url: string; source: AnalyzeRequestOptions['source'] }) => {
    setCurrentUrl(options.url);
    analyze(options);
  };

  const isRateLimit =
    error &&
    (error.message.includes('Instagram') ||
      error.message.includes('rate limit') ||
      error.message.includes('limiting') ||
      error.message.includes('YouTube'));

  return (
    <div className="relative z-10 px-4 py-12 sm:py-20 max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
          <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
          Universal Platform Engine v1.0
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Universal Media <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Downloader</span>
        </h1>

        <p className="text-sm sm:text-base text-text-muted leading-relaxed max-w-xl mx-auto">
          Download videos, audio, and media streams instantly from YouTube, YouTube Music, Instagram, X, Reddit, TikTok, Facebook, and more.
        </p>
      </div>

      {/* Input Form */}
      <UrlInputForm onAnalyze={handleAnalyze} isLoading={isPending} />

      {/* Warning Notice Banner (preserves active metadata while alerting user of rate-limit warnings) */}
      {warningNotice && metadata && (
        <div className="max-w-3xl mx-auto text-xs text-amber-300 bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20 flex items-center gap-2.5 shadow-lg backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{warningNotice}</span>
        </div>
      )}

      {/* Dynamic Results Area */}
      <div className="space-y-6">
        {isPending && !metadata && <SkeletonCard />}

        {isError && !metadata && (
          <ErrorMessage
            message={error?.message || 'Failed to analyze media link.'}
            onRetry={currentUrl ? () => handleAnalyze({ url: currentUrl, source: 'Retry' }) : undefined}
            isRateLimit={!!isRateLimit}
          />
        )}

        {metadata && (
          <MetadataCard metadata={metadata} />
        )}
      </div>

      {/* Features Grid */}
      <FeaturesGrid />
    </div>
  );
}
