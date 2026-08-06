import { useState, useRef, useCallback } from 'react';
import { MediaMetadata } from '@mediahub/types';
import { ApiService } from '../services/api.service';

const CLIENT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes frontend cache
const clientCache = new Map<string, { metadata: MediaMetadata; timestamp: number }>();
const inFlightPromises = new Map<string, Promise<MediaMetadata>>();

export type RequestStatus = 'IDLE' | 'ANALYZING' | 'SUCCESS' | 'FAILED';

export interface AnalyzeRequestOptions {
  url: string;
  source?: 'Paste' | 'Analyze Button' | 'Enter Key' | 'Retry' | 'Auto';
  forceRefresh?: boolean;
}

export function useAnalyzeMedia() {
  const [status, setStatus] = useState<RequestStatus>('IDLE');
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [warningNotice, setWarningNotice] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestCounterRef = useRef<number>(0);
  const activeUrlRef = useRef<string>('');

  const analyze = useCallback(async (options: AnalyzeRequestOptions): Promise<MediaMetadata | null> => {
    const { url, source = 'Auto', forceRefresh = false } = options;
    const cleanUrl = url.trim();

    if (!cleanUrl) return null;

    requestCounterRef.current += 1;
    const requestId = `Req-#${requestCounterRef.current}`;
    const timestamp = new Date().toLocaleTimeString();

    console.log(`[MediaHub Lifecycle Log] ${requestId} at ${timestamp} | Source: ${source} | URL: ${cleanUrl}`);

    // 1. Client-Side Cache Check (5-minute TTL)
    if (!forceRefresh) {
      const cached = clientCache.get(cleanUrl);
      if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS) {
        console.log(`[MediaHub Lifecycle Log] ${requestId} served from 5-minute client-side memory cache.`);
        setMetadata(cached.metadata);
        setStatus('SUCCESS');
        setError(null);
        setWarningNotice(null);
        activeUrlRef.current = cleanUrl;
        return cached.metadata;
      }
    }

    // 2. In-Flight Deduplication: If a request for this URL is ALREADY in flight, join it without aborting!
    if (inFlightPromises.has(cleanUrl)) {
      console.log(`[MediaHub Lifecycle Log] ${requestId} joined existing active in-flight request.`);
      setStatus('ANALYZING');
      try {
        const sharedResult = await inFlightPromises.get(cleanUrl)!;
        setMetadata(sharedResult);
        setStatus('SUCCESS');
        setError(null);
        setWarningNotice(null);
        activeUrlRef.current = cleanUrl;
        return sharedResult;
      } catch (err: any) {
        setError(err);
        setStatus('FAILED');
        return null;
      }
    }

    // 3. Abort previous pending request ONLY if user switched to a DIFFERENT URL
    if (abortControllerRef.current && activeUrlRef.current && activeUrlRef.current !== cleanUrl) {
      console.log(`[MediaHub Lifecycle Log] Aborting previous request for different URL: ${activeUrlRef.current}`);
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    activeUrlRef.current = cleanUrl;

    setStatus('ANALYZING');
    setError(null);
    setWarningNotice(null);

    const promise = (async () => {
      try {
        const result = await ApiService.analyzeMedia(cleanUrl, controller.signal);
        clientCache.set(cleanUrl, { metadata: result, timestamp: Date.now() });
        return result;
      } finally {
        inFlightPromises.delete(cleanUrl);
      }
    })();

    inFlightPromises.set(cleanUrl, promise);

    try {
      const fetchedMetadata = await promise;
      setMetadata(fetchedMetadata);
      setStatus('SUCCESS');
      setError(null);
      setWarningNotice(null);
      return fetchedMetadata;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`[MediaHub Lifecycle Log] Request ${requestId} aborted cleanly.`);
        return null;
      }

      console.error(`[MediaHub Lifecycle Log] Request ${requestId} failed: ${err.message}`);
      setError(err);
      setStatus('FAILED');
      return null;
    }
  }, []);

  return {
    analyze,
    status,
    metadata,
    error,
    warningNotice,
    isPending: status === 'ANALYZING',
    isSuccess: status === 'SUCCESS' && !!metadata,
    isError: status === 'FAILED',
  };
}
