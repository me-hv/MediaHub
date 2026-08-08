'use client';

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { ApiService } from '../services/api.service';

export type DownloadStage =
  | 'IDLE'
  | 'PREPARING'
  | 'DOWNLOADING_SOURCE'
  | 'CONVERTING_FFMPEG'
  | 'STREAMING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

export interface ActiveDownloadJob {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  formatId: string;
  formatLabel: string;
  ext: string;
  requiresConversion: boolean;
  stage: DownloadStage;
  stageMessage: string;
  progressPercent?: number;
  isIndeterminate: boolean;
  estimatedSize?: string;
  startedAt: number;
  finalSize?: number;
  error?: string;
}

interface DownloadContextType {
  activeJob: ActiveDownloadJob | null;
  downloadHistory: ActiveDownloadJob[];
  startDownload: (params: {
    url: string;
    formatId: string;
    title: string;
    formatLabel: string;
    requiresConversion: boolean;
    ext: string;
    thumbnail?: string;
    estimatedSize?: string;
  }) => Promise<void>;
  cancelDownload: () => void;
  clearActiveJob: () => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const [activeJob, setActiveJob] = useState<ActiveDownloadJob | null>(null);
  const [downloadHistory, setDownloadHistory] = useState<ActiveDownloadJob[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearActiveJob = useCallback(() => {
    setActiveJob(null);
  }, []);

  const cancelDownload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setActiveJob((prev) => {
      if (!prev) return null;
      const cancelledJob: ActiveDownloadJob = {
        ...prev,
        stage: 'CANCELLED',
        stageMessage: 'Download cancelled by user.',
        isIndeterminate: false,
      };
      setDownloadHistory((h) => [cancelledJob, ...h.slice(0, 19)]);
      return cancelledJob;
    });
    abortControllerRef.current = null;
  }, []);

  const startDownload = useCallback(
    async ({
      url,
      formatId,
      title,
      formatLabel,
      requiresConversion,
      ext,
      thumbnail,
      estimatedSize,
    }: {
      url: string;
      formatId: string;
      title: string;
      formatLabel: string;
      requiresConversion: boolean;
      ext: string;
      thumbnail?: string;
      estimatedSize?: string;
    }) => {
      // Prevent double download click
      if (activeJob && (activeJob.stage === 'PREPARING' || activeJob.stage === 'DOWNLOADING_SOURCE' || activeJob.stage === 'CONVERTING_FFMPEG' || activeJob.stage === 'STREAMING')) {
        console.warn('[MediaHub Download] Download already in progress. Double click blocked.');
        return;
      }

      const jobId = `dl-${Date.now()}`;
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const initialJob: ActiveDownloadJob = {
        id: jobId,
        url,
        title,
        thumbnail,
        formatId,
        formatLabel,
        ext,
        requiresConversion,
        stage: 'PREPARING',
        stageMessage: 'Preparing your download request...',
        isIndeterminate: true,
        estimatedSize,
        startedAt: Date.now(),
      };

      setActiveJob(initialJob);

      // Stage 2: Downloading Source
      const sourceTimer = setTimeout(() => {
        setActiveJob((prev) => {
          if (!prev || prev.id !== jobId || prev.stage === 'CANCELLED') return prev;
          return {
            ...prev,
            stage: 'DOWNLOADING_SOURCE',
            stageMessage: 'Fetching original media stream...',
          };
        });
      }, 1200);

      // Stage 3: FFmpeg Conversion (if format requires conversion)
      const convTimer = setTimeout(() => {
        setActiveJob((prev) => {
          if (!prev || prev.id !== jobId || prev.stage === 'CANCELLED') return prev;
          if (!requiresConversion) return prev;
          return {
            ...prev,
            stage: 'CONVERTING_FFMPEG',
            stageMessage: `Converting media to ${ext.toUpperCase()} with FFmpeg...`,
          };
        });
      }, 3500);

      try {
        const blob = await ApiService.downloadMedia(url, formatId, abortController.signal);

        clearTimeout(sourceTimer);
        clearTimeout(convTimer);

        if (blob.size === 0) {
          throw new Error('Downloaded file is 0 bytes. Conversion output empty.');
        }

        // Stage 4: Streaming & Triggering Browser Save
        setActiveJob((prev) => {
          if (!prev || prev.id !== jobId) return prev;
          return {
            ...prev,
            stage: 'STREAMING',
            stageMessage: 'Finalizing file download...',
            finalSize: blob.size,
          };
        });

        const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
        const filename = `${safeTitle}-${formatId.replace('+', '_')}.${ext}`;

        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);

        // Stage 5: Success
        const successJob: ActiveDownloadJob = {
          id: jobId,
          url,
          title,
          thumbnail,
          formatId,
          formatLabel,
          ext,
          requiresConversion,
          stage: 'SUCCESS',
          stageMessage: `Download complete (${(blob.size / 1024 / 1024).toFixed(2)} MB)`,
          progressPercent: 100,
          isIndeterminate: false,
          estimatedSize,
          startedAt: initialJob.startedAt,
          finalSize: blob.size,
        };

        setActiveJob(successJob);
        setDownloadHistory((h) => [successJob, ...h.slice(0, 19)]);
      } catch (err: any) {
        clearTimeout(sourceTimer);
        clearTimeout(convTimer);

        if (err.name === 'AbortError') {
          console.log(`[MediaHub Download] Job ${jobId} aborted by user.`);
          return; // Already handled by cancelDownload
        }

        const failedJob: ActiveDownloadJob = {
          id: jobId,
          url,
          title,
          thumbnail,
          formatId,
          formatLabel,
          ext,
          requiresConversion,
          stage: 'FAILED',
          stageMessage: err.message || 'Download failed. Please try again.',
          isIndeterminate: false,
          estimatedSize,
          startedAt: initialJob.startedAt,
          error: err.message || 'Download failed.',
        };

        setActiveJob(failedJob);
        setDownloadHistory((h) => [failedJob, ...h.slice(0, 19)]);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [activeJob]
  );

  return (
    <DownloadContext.Provider
      value={{
        activeJob,
        downloadHistory,
        startDownload,
        cancelDownload,
        clearActiveJob,
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownload() {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownload must be used within a DownloadProvider');
  }
  return context;
}
