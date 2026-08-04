'use client';

import React, { useState } from 'react';
import { MediaMetadata, QualityCategory, QualityOption } from '@mediahub/types';
import { formatDuration, formatBytes } from '@mediahub/utils';
import { PlatformBadge } from './PlatformBadge';
import { useDownloadMedia } from '../../hooks/useDownloadMedia';
import { Download, Clock, User, Film, Music, CheckCircle2, Loader2, XCircle, AlertCircle, Eye, Calendar, Info, Cpu } from 'lucide-react';

interface MetadataCardProps {
  metadata: MediaMetadata;
}

export function MetadataCard({ metadata }: MetadataCardProps) {
  const [activeTab, setActiveTab] = useState<QualityCategory>('combined');
  const [selectedFormatId, setSelectedFormatId] = useState<string>('');
  const [showInspector, setShowInspector] = useState<boolean>(false);

  const { startDownload, cancelDownload, isDownloading, error: downloadError } = useDownloadMedia();

  const currentFormats: QualityOption[] = metadata.qualities[activeTab] || [];
  const activeFormat = currentFormats.find((f) => f.formatId === selectedFormatId) || currentFormats[0];

  const handleDownload = () => {
    if (!activeFormat) return;
    const ext = activeFormat.ext || (activeTab === 'audio' ? 'mp3' : 'mp4');
    const safeTitle = metadata.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
    const filename = `${safeTitle}-${activeFormat.formatId}.${ext}`;
    
    startDownload(metadata.url, activeFormat.formatId, filename);
  };

  return (
    <div className="w-full max-w-3xl mx-auto glass-panel rounded-2xl p-6 space-y-6 shadow-2xl transition-all duration-300">
      {/* Top Media Details */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Thumbnail */}
        <div className="relative w-full md:w-72 h-44 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 group">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <Film className="w-10 h-10" />
            </div>
          )}
          {metadata.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-xs font-mono text-white flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              {formatDuration(metadata.duration)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlatformBadge platform={metadata.platform} />
              {metadata.cachedAt && (
                <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-medium">
                  ⚡ 6h Cache Hit
                </span>
              )}
            </div>

            <button
              onClick={() => setShowInspector(!showInspector)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showInspector ? 'Hide Inspector' : 'Media Inspector'}</span>
            </button>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-2">
            {metadata.title}
          </h3>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            {metadata.uploader && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                {metadata.uploader}
              </span>
            )}
            {metadata.viewCount && (
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                {metadata.viewCount.toLocaleString()} views
              </span>
            )}
            {metadata.uploadDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {metadata.uploadDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Media Inspector Drawer */}
      {showInspector && (
        <div className="bg-slate-950/80 rounded-xl p-4 border border-white/10 text-xs space-y-2 animate-in fade-in slide-in-from-top-2">
          <p className="font-semibold text-indigo-400 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" /> Extended Media Inspector
          </p>
          {metadata.description && (
            <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-3 bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
              {metadata.description}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400 font-mono text-[11px] pt-1">
            <div>Format ID: <span className="text-white">{activeFormat?.formatId || 'N/A'}</span></div>
            <div>Video Codec: <span className="text-white">{activeFormat?.vcodec || 'N/A'}</span></div>
            <div>Audio Codec: <span className="text-white">{activeFormat?.acodec || 'N/A'}</span></div>
            <div>FPS: <span className="text-white">{activeFormat?.fps || 'N/A'}</span></div>
          </div>
        </div>
      )}

      {/* Quality Selection Tabs */}
      <div className="space-y-3 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Stream Format</span>
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-white/10">
            {(['combined', 'video', 'audio'] as QualityCategory[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedFormatId('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200 ${
                  activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Formats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {currentFormats.length === 0 ? (
            <p className="text-xs text-slate-500 col-span-2 py-4 text-center">No specific {activeTab} streams found. Try Combined formats.</p>
          ) : (
            currentFormats.map((fmt) => {
              const isSelected = (selectedFormatId || activeFormat?.formatId) === fmt.formatId;
              return (
                <button
                  key={fmt.formatId}
                  onClick={() => setSelectedFormatId(fmt.formatId)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-white ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/50 border-white/5 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {fmt.qualityLabel || fmt.resolution || 'Standard Quality'}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase">
                        {fmt.ext} • {fmt.fps ? `${fmt.fps}fps` : 'Stream'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-indigo-300 font-medium">
                    {formatBytes(fmt.filesize || fmt.filesizeApprox)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Error state */}
      {downloadError && (
        <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{downloadError}</span>
          </div>
        </div>
      )}

      {/* Download Trigger */}
      <div className="flex items-center gap-3 pt-2">
        {isDownloading ? (
          <button
            onClick={cancelDownload}
            className="w-full flex items-center justify-center gap-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-medium text-sm py-3.5 px-6 rounded-xl transition-all"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel Download Stream</span>
          </button>
        ) : (
          <button
            onClick={handleDownload}
            disabled={!activeFormat}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Download Selected Format ({activeFormat?.qualityLabel || activeFormat?.resolution || 'Media'})</span>
          </button>
        )}
      </div>
    </div>
  );
}
