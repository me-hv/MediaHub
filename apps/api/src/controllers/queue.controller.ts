import { Context } from 'hono';
import { globalQueueManager } from '@mediahub/queue';
import { mediaHubEvents } from '@mediahub/events';
import { sanitizeAndValidateUrl, detectPlatform } from '@mediahub/utils';
import { ProviderFactory } from '@mediahub/downloader';
import { HistoryService } from '../services/history.service';
import type { AppEnv } from '../app';

export class QueueController {
  static async analyzeBatch(c: Context<AppEnv>) {
    const requestId = c.get('requestId') || 'req-unknown';
    const body = await c.req.json();
    const urls: string[] = body?.urls || [];

    if (!Array.isArray(urls) || urls.length === 0) {
      return c.json({ success: false, code: 'INVALID_BATCH', message: 'Please provide an array of media URLs.', timestamp: new Date().toISOString(), requestId }, 400);
    }

    if (urls.length > 50) {
      return c.json({ success: false, code: 'BATCH_LIMIT_EXCEEDED', message: 'Maximum 50 URLs allowed per batch request.', timestamp: new Date().toISOString(), requestId }, 400);
    }

    const items = urls.map((raw) => {
      const val = sanitizeAndValidateUrl(raw);
      if (!val.success) {
        return { rawUrl: raw, valid: false, error: val.error, platform: 'UNKNOWN' };
      }
      return { rawUrl: val.url, urlHash: val.hash, valid: true, platform: detectPlatform(val.url) };
    });

    return c.json({ success: true, data: { items, totalCount: items.length }, timestamp: new Date().toISOString(), requestId });
  }

  static async enqueueBatch(c: Context<AppEnv>) {
    const user = c.get('user');
    const requestId = c.get('requestId') || 'req-unknown';
    const body = await c.req.json();
    const items: Array<{ url: string; formatId?: string }> = body?.items || [];

    const jobResults = items.map((item) => {
      const val = sanitizeAndValidateUrl(item.url);
      if (!val.success) return { url: item.url, status: 'INVALID_URL' };

      const formatId = item.formatId || 'best';
      const provider = ProviderFactory.getProvider(val.url);
      const platform = detectPlatform(val.url);

      const enqueueRes = globalQueueManager.enqueue({
        userId: user?.id,
        jobType: 'BATCH',
        rawUrl: val.url,
        formatId,
        task: async () => {
          const { stream } = await provider.getStream(val.url, formatId);
          await new Promise<void>((resolve, reject) => {
            stream.on('end', resolve);
            stream.on('error', reject);
          });
          await HistoryService.addHistory({
            userId: user?.id,
            urlHash: val.hash,
            rawUrl: val.url,
            title: `Batch Download (${val.hash.slice(0, 6)})`,
            platform,
            formatId,
            status: 'COMPLETED',
          });
        },
      });

      return { url: val.url, jobId: enqueueRes.jobId, status: enqueueRes.status };
    });

    return c.json({ success: true, data: { jobs: jobResults }, timestamp: new Date().toISOString(), requestId });
  }

  // Multi-job SSE stream broadcasting real-time progress for active queue jobs
  static async streamProgress(c: Context<AppEnv>) {
    const user = c.get('user');

    const bodyStream = new ReadableStream({
      start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        };

        const onProgress = (payload: any) => {
          if (!user || !payload.userId || payload.userId === user.id) {
            sendEvent('progress', payload);
          }
        };

        const onCompleted = (payload: any) => {
          if (!user || !payload.userId || payload.userId === user.id) {
            sendEvent('completed', payload);
          }
        };

        const onFailed = (payload: any) => {
          if (!user || !payload.userId || payload.userId === user.id) {
            sendEvent('failed', payload);
          }
        };

        mediaHubEvents.on('ProgressUpdated', onProgress);
        mediaHubEvents.on('DownloadCompleted', onCompleted);
        mediaHubEvents.on('DownloadFailed', onFailed);

        // Send initial active jobs snapshot
        const activeJobs = globalQueueManager.getAllJobs(user?.id);
        sendEvent('snapshot', { jobs: activeJobs });

        // Keep-alive heartbeat every 15s
        const heartbeat = setInterval(() => {
          controller.enqueue(': heartbeat\n\n');
        }, 15000);

        c.req.raw.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          mediaHubEvents.off('ProgressUpdated', onProgress);
          mediaHubEvents.off('DownloadCompleted', onCompleted);
          mediaHubEvents.off('DownloadFailed', onFailed);
        });
      },
    });

    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');

    return c.body(bodyStream);
  }
}
