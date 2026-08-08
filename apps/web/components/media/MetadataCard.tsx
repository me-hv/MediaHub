'use client';

import React, { useState, useEffect } from 'react';
import { MediaMetadata, QualityCategory, QualityOption } from '@mediahub/types';
import { formatDuration, formatBytes } from '@mediahub/utils';
import { PlatformBadge } from './PlatformBadge';
import { AudioPreviewPlayer } from './AudioPreviewPlayer';
import { useDownload } from '../../context/DownloadContext';
import { DownloadProgressPanel } from './DownloadProgressPanel';
import {
  Download,
  Clock,
  User,
  Film,
  Music,
  Eye,
  Calendar,
  Info,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface MetadataCardProps {
  metadata: MediaMetadata;
}

export function MetadataCard({ metadata }: MetadataCardProps) {
  const hasVideoOrCombined = metadata.qualities.video.length > 0 || metadata.qualities.combined.length > 0;
  const isMusicSource = metadata.url.includes('music.youtube.com') || !hasVideoOrCombined;

  const initialTab: QualityCategory = isMusicSource
    ? 'audio'
    : metadata.qualities.video.length > 0
    ? 'video'
    : metadata.qualities.combined.length > 0
    ? 'combined'
    : 'audio';

  const [activeTab, setActiveTab] = useState<QualityCategory>(initialTab);
  const [selectedFormatId, setSelectedFormatId] = useState<string>('');
  const [showInspector, setShowInspector] = useState<boolean>(false);

  useEffect(() => {
    const nextTab: QualityCategory = isMusicSource
      ? 'audio'
      : metadata.qualities.video.length > 0
      ? 'video'
      : metadata.qualities.combined.length > 0
      ? 'combined'
      : 'audio';
    setActiveTab(nextTab);
  }, [metadata.url, isMusicSource, metadata.qualities.video.length, metadata.qualities.combined.length]);

  const { startDownload, activeJob } = useDownload();

  const currentFormats: QualityOption[] =
    activeTab === 'video' && metadata.qualities.video.length === 0
      ? metadata.qualities.combined
      : metadata.qualities[activeTab] || [];

  const activeFormat: QualityOption | undefined =
    currentFormats.find((f) => f.formatId === selectedFormatId) || currentFormats[0];

  const originalAudioStreams = currentFormats.filter((f) => !f.requiresConversion);
  const convertedAudioFormats = currentFormats.filter((f) => f.requiresConversion);

  const getFormatSizeDisplay = (fmt?: QualityOption): string => {
    if (!fmt) return 'Stream';
    const size = fmt.filesize || fmt.filesizeApprox;
    if (size && size > 0) return formatBytes(size);
    if (fmt.filesizeEstimated && fmt.filesizeEstimated > 0) {
      return `≈ ${formatBytes(fmt.filesizeEstimated)}`;
    }
    return 'Stream';
  };

  const handleDownload = () => {
    if (!activeFormat) return;
    const ext = activeFormat.ext || (activeTab === 'audio' ? 'mp3' : 'mp4');
    const resLabel =
      activeFormat.width && activeFormat.height
        ? `${activeFormat.width}×${activeFormat.height}`
        : activeFormat.resolution || activeFormat.qualityLabel || 'Standard Quality';

    startDownload({
      url: metadata.url,
      formatId: activeFormat.formatId,
      title: metadata.title,
      formatLabel: resLabel,
      requiresConversion: !!activeFormat.requiresConversion,
      ext,
      thumbnail: metadata.thumbnail,
      estimatedSize: getFormatSizeDisplay(activeFormat),
    });
  };

  const renderFormatButton = (fmt: QualityOption) => {
    const isSelected = (selectedFormatId || activeFormat?.formatId) === fmt.formatId;
    const resLabel =
      fmt.width && fmt.height
        ? `${fmt.width}×${fmt.height}`
        : fmt.resolution || fmt.qualityLabel || 'Standard Quality';

    return (
      <button
        key={fmt.formatId}
        onClick={() => setSelectedFormatId(fmt.formatId)}
        className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
          isSelected
            ? 'bg-[#22252a] border-indigo-500/60 text-white'
            : 'bg-[#121316]/80 border-[#2a2d32] text-[#9a9da5] hover:bg-[#22252a] hover:text-[#f2f3f5]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
              isSelected ? 'border-indigo-400 bg-indigo-500/20' : 'border-[#6f737d]'
            }`}
          >
            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-white">{resLabel}</span>
              {fmt.hasVideo && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono border border-emerald-500/20">
                  Audio Included
                </span>
              )}
              {fmt.requiresConversion && (
                <span className="text-[10px] text-purple-300 bg-purple-500/10 px-1.5 py-0.2 rounded font-mono border border-purple-500/20">
                  Transcode
                </span>
              )}
              {fmt.hdr && (
                <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded font-mono border border-amber-500/20">
                  HDR
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-[#9a9da5] truncate mt-0.5">
              .{fmt.ext} • {fmt.vcodec ? fmt.vcodec.split('.')[0] : 'audio'}
              {fmt.acodec && fmt.acodec !== 'none' ? `/${fmt.acodec.split('.')[0]}` : ''}{' '}
              {fmt.tbr ? `• ${fmt.tbr} kbps` : ''}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-[#9a9da5] shrink-0 ml-2">
          {getFormatSizeDisplay(fmt)}
        </span>
      </button>
    );
  };

  const isDownloadingThisMedia =
    activeJob &&
    activeJob.url === metadata.url &&
    (activeJob.stage === 'PREPARING' ||
      activeJob.stage === 'DOWNLOADING_SOURCE' ||
      activeJob.stage === 'CONVERTING_FFMPEG' ||
      activeJob.stage === 'STREAMING');

  return (
    <div className="w-full max-w-3xl mx-auto bg-[#1c1e22] border border-[#2a2d32] rounded-xl p-5 space-y-5 shadow-lg">
      {/* Top Media Details */}
      <div className="flex flex-col md:flex-row gap-5">
        {/* Thumbnail */}
        <div className="relative w-full md:w-64 h-40 rounded-lg overflow-hidden bg-[#121316] border border-[#2a2d32] shrink-0">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#6f737d]">
              <Film className="w-8 h-8" />
            </div>
          )}
          {metadata.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[11px] font-mono text-[#f2f3f5] flex items-center gap-1 border border-[#2a2d32]">
              <Clock className="w-3 h-3 text-[#9a9da5]" />
              {formatDuration(metadata.duration)}
            </div>
          )}
        </div>

        {/* Info Header */}
        <div className="flex-1 space-y-2.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <PlatformBadge platform={metadata.platform} />
            <button
              onClick={() => setShowInspector(!showInspector)}
              className="text-[11px] text-[#9a9da5] hover:text-[#f2f3f5] flex items-center gap-1 px-2 py-1 rounded bg-[#121316] border border-[#2a2d32] transition-colors"
            >
              <Info className="w-3 h-3 text-[#6f737d]" />
              <span>{showInspector ? 'Hide Inspector' : 'Inspector'}</span>
            </button>
          </div>

          <h3 className="text-base font-semibold text-[#f2f3f5] leading-snug line-clamp-2">
            {metadata.title}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#9a9da5]">
            {(metadata.uploader || metadata.channel) && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#6f737d]" />
                {metadata.uploader || metadata.channel}
              </span>
            )}
            {metadata.viewCount && (
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[#6f737d]" />
                {metadata.viewCount.toLocaleString()} views
              </span>
            )}
            {metadata.uploadDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#6f737d]" />
                {metadata.uploadDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Audio Stream Preview */}
      <AudioPreviewPlayer title={metadata.title} artist={metadata.uploader || metadata.channel} />

      {/* Media Inspector Drawer */}
      {showInspector && (
        <div className="bg-[#121316] rounded-lg p-3.5 border border-[#2a2d32] text-xs space-y-2 font-mono text-[#9a9da5]">
          <p className="font-semibold text-[#f2f3f5] flex items-center gap-1 text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Technical Stream Details
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] pt-1">
            <div>Format ID: <span className="text-[#f2f3f5]">{activeFormat?.formatId || 'N/A'}</span></div>
            <div>Codec: <span className="text-[#f2f3f5]">{activeFormat?.vcodec || activeFormat?.acodec || 'N/A'}</span></div>
            <div>Bitrate: <span className="text-[#f2f3f5]">{activeFormat?.tbr ? `${activeFormat.tbr} kbps` : 'N/A'}</span></div>
            <div>HDR: <span className="text-[#f2f3f5]">{activeFormat?.hdr ? 'Yes' : 'No'}</span></div>
          </div>
        </div>
      )}

      {/* Format Selector Category Tabs */}
      <div className="space-y-3 pt-3 border-t border-[#2a2d32]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#9a9da5] uppercase tracking-wider">
            Select Stream Format
          </span>
          <div className="flex bg-[#121316] p-0.5 rounded border border-[#2a2d32]">
            {(['video', 'combined', 'audio'] as QualityCategory[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedFormatId('');
                }}
                className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-[#22252a] text-[#f2f3f5] shadow-sm'
                    : 'text-[#9a9da5] hover:text-[#f2f3f5]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Section: Native vs Transcoded */}
        {activeTab === 'audio' ? (
          <div className="space-y-3">
            {originalAudioStreams.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-[#9a9da5] uppercase tracking-wider flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-[#6f737d]" /> Native Source Audio
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {originalAudioStreams.map(renderFormatButton)}
                </div>
              </div>
            )}

            {convertedAudioFormats.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-[#2a2d32]">
                <p className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-purple-400" /> Converted Audio Formats (FFmpeg)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {convertedAudioFormats.map(renderFormatButton)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
            {currentFormats.length === 0 ? (
              <p className="text-xs text-[#6f737d] col-span-2 py-4 text-center">
                No specific {activeTab} streams found. Try Combined formats.
              </p>
            ) : (
              currentFormats.map(renderFormatButton)
            )}
          </div>
        )}
      </div>

      {/* Real-time Download Status Panel */}
      {activeJob && activeJob.url === metadata.url && (
        <div className="pt-2">
          <DownloadProgressPanel />
        </div>
      )}

      {/* Primary Action Button */}
      {(!activeJob ||
        activeJob.url !== metadata.url ||
        activeJob.stage === 'SUCCESS' ||
        activeJob.stage === 'FAILED' ||
        activeJob.stage === 'CANCELLED') && (
        <div className="pt-1">
          <button
            onClick={handleDownload}
            disabled={!activeFormat || !!isDownloadingThisMedia}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-3 px-5 rounded-md shadow-sm transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              Download {activeFormat?.qualityLabel || activeFormat?.resolution || 'Selected Format'} (
              {getFormatSizeDisplay(activeFormat)})
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
