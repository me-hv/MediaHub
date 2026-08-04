import { useState, useRef } from 'react';
import { ApiService } from '../services/api.service';

export function useDownloadMedia() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startDownload = async (url: string, formatId: string, filename: string) => {
    setIsDownloading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const blob = await ApiService.downloadMedia(url, formatId, abortControllerRef.current.signal);
      
      // Trigger native browser download
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Download cancelled by user.');
      } else {
        setError(err.message || 'Download failed');
      }
    } finally {
      setIsDownloading(false);
      abortControllerRef.current = null;
    }
  };

  const cancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsDownloading(false);
      setError('Download cancelled.');
    }
  };

  return {
    startDownload,
    cancelDownload,
    isDownloading,
    error,
    setError,
  };
}
