'use client';

import React from 'react';
import { useAnalyzeMedia } from '../hooks/useAnalyzeMedia';
import { UrlInputForm } from '../components/media/UrlInputForm';
import { SkeletonCard } from '../components/media/SkeletonCard';
import { MetadataCard } from '../components/media/MetadataCard';
import { ErrorMessage } from '../components/media/ErrorMessage';
import { FeaturesGrid } from '../components/media/FeaturesGrid';

export default function HomePage() {
  const analyzeMutation = useAnalyzeMedia();

  const handleAnalyze = (url: string) => {
    analyzeMutation.mutate({ url });
  };

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
          Download videos, audio, and media streams instantly from YouTube, Instagram, X, Reddit, TikTok, Facebook, and more.
        </p>
      </div>

      {/* Input Form */}
      <UrlInputForm onAnalyze={handleAnalyze} isLoading={analyzeMutation.isPending} />

      {/* Dynamic Results Area */}
      <div className="space-y-6">
        {analyzeMutation.isPending && <SkeletonCard />}

        {analyzeMutation.isError && (
          <ErrorMessage message={analyzeMutation.error.message || 'Failed to analyze media link.'} />
        )}

        {analyzeMutation.isSuccess && analyzeMutation.data && (
          <MetadataCard metadata={analyzeMutation.data} />
        )}
      </div>

      {/* Features Grid */}
      <FeaturesGrid />
    </div>
  );
}
