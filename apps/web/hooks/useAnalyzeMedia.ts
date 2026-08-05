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
  const lastUrlRef = useRef<string>('');

  const analyze = useCallback(async (options: AnalyzeRequestOptions): Promise<MediaMetadata | null> => {
    const { url, source = 'Auto', forceRefresh = false } = options;
    const cleanUrl = url.trim();

    if (!cleanUrl) return null;

    requestCounterRef.current += 1;
    const requestId = `Req-#${requestCounterRef.current}`;
    const timestamp = new Date().toLocaleTimeString();

    console.log(`[MediaHub Lifecycle Log] ${requestId} at ${timestamp} | Source: ${source} | URL: ${cleanUrl}`);

    // 1. Client-Side Deduplication: If URL is identical to last analyzed and not forced, return active metadata
    if (!forceRefresh && lastUrlRef.current === cleanUrl && metadata) {
      console.log(`[MediaHub Lifecycle Log] ${requestId} skipped - identical URL already loaded in UI state.`);
      return metadata;
    }

    // 2. Client-Side Cache Check (5-minute TTL)
    if (!forceRefresh) {
      const cached = clientCache.get(cleanUrl);
      if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS) {
        console.log(`[MediaHub Lifecycle Log] ${requestId} served from 5-minute client-side memory cache.`);
        setMetadata(cached.metadata);
        setStatus('SUCCESS');
        setError(null);
        setWarningNotice(null);
        lastUrlRef.current = cleanUrl;
        return cached.metadata;
      }
    }

    // 3. In-Flight Request Deduplication: If request for this URL is already pending, join it
    if (inFlightPromises.has(cleanUrl)) {
      console.log(`[MediaHub Lifecycle Log] ${requestId} joined existing in-flight analysis promise.`);
      setStatus('ANALYZING');
      try {
        const sharedResult = await inFlightPromises.get(cleanUrl)!;
        setMetadata(sharedResult);
        setStatus('SUCCESS');
        setError(null);
        setWarningNotice(null);
        lastUrlRef.current = cleanUrl;
        return sharedResult;
      } catch (err: any) {
        // If shared request failed but we already had valid metadata, preserve valid metadata!
        if (metadata) {
          console.warn(`[MediaHub Lifecycle Log] In-flight retry failed. Preserving existing valid metadata.`);
          setWarningNotice('Server retried analysis but encountered a temporary rate limit. Your media details remain active.');
        } else {
          setError(err);
          setStatus('FAILED');
        }
        return null;
      }
    }

    // 4. Abort previous stale request if active
    if (abortControllerRef.current) {
      console.log(`[MediaHub Lifecycle Log] Aborting previous pending network request.`);
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

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
      lastUrlRef.current = cleanUrl;
      return fetchedMetadata;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`[MediaHub Lifecycle Log] Request ${requestId} aborted cleanly.`);
        return null;
      }

      console.error(`[MediaHub Lifecycle Log] Request ${requestId} failed: ${err.message}`);

      // CRITICAL PRESERVATION RULE: Never overwrite existing valid metadata with a subsequent error!
      if (metadata && (lastUrlRef.current === cleanUrl || metadata.url.includes(cleanUrl))) {
        console.warn(`[MediaHub Lifecycle Log] Subsequent request failed. PRESERVING valid metadata!`);
        setWarningNotice('YouTube is temporarily limiting requests. Your previous successful analysis remains active.');
        setStatus('SUCCESS'); // Remain in SUCCESS state so card stays visible
      } else {
        setError(err);
        setStatus('FAILED');
      }
      return null;
    }
  }, [metadata]);

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
