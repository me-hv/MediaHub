import { Context } from 'hono';
import { sanitizeAndValidateUrl, detectPlatform } from '@mediahub/utils';
import { ProviderFactory, YtDlpWrapper } from '@mediahub/downloader';
import { FFmpegManager, AudioTranscodeOptions, AudioFormat } from '@mediahub/audio';
import { MediaService } from '../services/media.service';
import { HistoryService } from '../services/history.service';
import { logger } from '../utils/logger';
import type { AppEnv } from '../app';

export class MediaController {
  static async analyzeMedia(c: Context<AppEnv>) {
    const requestId = c.get('requestId') || 'req-unknown';

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          success: false,
          code: 'INVALID_JSON',
          message: 'Malformed JSON payload provided.',
          timestamp: new Date().toISOString(),
          requestId,
        },
        400
      );
    }

    const validation = sanitizeAndValidateUrl(body?.url);
    if (!validation.success) {
      return c.json(
        {
          success: false,
          code: 'INVALID_URL',
          message: validation.error,
          timestamp: new Date().toISOString(),
          requestId,
        },
        400
      );
    }

    try {
      const metadata = await MediaService.analyzeMedia(validation.url, validation.hash);

      return c.json({
        success: true,
        data: { metadata },
        timestamp: new Date().toISOString(),
        requestId,
      });
    } catch (err: any) {
      logger.error({ error: err.message, code: err.code, requestId }, 'Error analyzing media');
      const isRateLimit = err.code === 'YOUTUBE_RATE_LIMIT' || err.code === 'INSTAGRAM_RATE_LIMIT' || err.code === 'RATE_LIMIT_EXCEEDED';
      const statusCode = isRateLimit ? 429 : 500;

      return c.json(
        {
          success: false,
          code: err.code || 'ANALYSIS_FAILED',
          message: err.message || 'Unable to extract media metadata.',
          retryAfter: err.retryAfter || (isRateLimit ? 60 : undefined),
          timestamp: new Date().toISOString(),
          requestId,
        },
        statusCode
      );
    }
  }

  static async getSubtitles(c: Context<AppEnv>) {
    const requestId = c.get('requestId') || 'req-unknown';
    const body = await c.req.json();
    const validation = sanitizeAndValidateUrl(body?.url);

    if (!validation.success) {
      return c.json({ success: false, code: 'INVALID_URL', message: validation.error, timestamp: new Date().toISOString(), requestId }, 400);
    }

    const subtitles = await YtDlpWrapper.fetchSubtitles(validation.url);
    return c.json({ success: true, data: { subtitles }, timestamp: new Date().toISOString(), requestId });
  }

  static async extractAudio(c: Context<AppEnv>) {
    const user = c.get('user');
    const requestId = c.get('requestId') || 'req-unknown';
    const body = await c.req.json();
    const validation = sanitizeAndValidateUrl(body?.url);

    if (!validation.success) {
      return c.json({ success: false, code: 'INVALID_URL', message: validation.error, timestamp: new Date().toISOString(), requestId }, 400);
    }

    const format = (body?.format || 'mp3') as 'mp3' | 'm4a' | 'aac';
    const platform = detectPlatform(validation.url);

    try {
      const { stream, process: childProcess } = await YtDlpWrapper.createAudioExtractStream(validation.url, format);

      await HistoryService.addHistory({
        userId: user?.id,
        urlHash: validation.hash,
        rawUrl: validation.url,
        title: `Extracted Audio (${format.toUpperCase()})`,
        platform,
        formatId: format,
        mediaType: 'AUDIO',
        status: 'SUCCESS',
      });

      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (err: Error) => {
            if (!childProcess.killed) childProcess.kill('SIGTERM');
            controller.error(err);
          });
        },
        cancel() {
          if (!childProcess.killed) childProcess.kill('SIGTERM');
        },
      });

      c.header('Content-Type', 'audio/mpeg');
      c.header('Content-Disposition', `attachment; filename="audio-${validation.hash.slice(0, 8)}.${format}"`);
      return c.body(webStream);
    } catch (err: any) {
      return c.json({ success: false, code: 'AUDIO_EXTRACT_FAILED', message: err.message, timestamp: new Date().toISOString(), requestId }, 500);
    }
  }

  static async downloadMedia(c: Context<AppEnv>) {
    const user = c.get('user');
    const requestId = c.get('requestId') || 'req-unknown';

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, code: 'INVALID_JSON', message: 'Malformed JSON payload.', timestamp: new Date().toISOString(), requestId }, 400);
    }

    const validation = sanitizeAndValidateUrl(body?.url);
    if (!validation.success) {
      return c.json({ success: false, code: 'INVALID_URL', message: validation.error, timestamp: new Date().toISOString(), requestId }, 400);
    }

    const formatId = body?.formatId || 'best';
    const platform = detectPlatform(validation.url);
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

    try {
      // 1. Handle Converted Audio Formats (conv-*)
      if (formatId.startsWith('conv-')) {
        let format: AudioFormat = 'mp3';
        let bitrate = '320';

        if (formatId.includes('flac')) {
          format = 'flac';
        } else if (formatId.includes('wav')) {
          format = 'wav';
        } else if (formatId.includes('aac')) {
          format = 'm4a';
          bitrate = formatId.split('-')[2] || '256';
        } else if (formatId.includes('ogg')) {
          format = 'ogg';
        } else if (formatId.includes('mp3')) {
          format = 'mp3';
          bitrate = formatId.split('-')[2] || '320';
        }

        const { stream: ytStream, process: ytProc } = await YtDlpWrapper.createAudioExtractStream(validation.url, 'm4a');
        const { stream: transStream, process: ffmpegProc } = FFmpegManager.createTranscodeProcess(ytStream, { format, bitrate });

        const webStream = new ReadableStream({
          start(controller) {
            transStream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
            transStream.on('end', () => controller.close());
            transStream.on('error', (err: Error) => {
              if (!ytProc.killed) ytProc.kill('SIGTERM');
              if (!ffmpegProc.killed) ffmpegProc.kill('SIGTERM');
              controller.error(err);
            });
          },
          cancel() {
            if (!ytProc.killed) ytProc.kill('SIGTERM');
            if (!ffmpegProc.killed) ffmpegProc.kill('SIGTERM');
          },
        });

        const contentTypeMap: Record<string, string> = {
          mp3: 'audio/mpeg',
          flac: 'audio/flac',
          wav: 'audio/wav',
          m4a: 'audio/mp4',
          ogg: 'audio/ogg',
        };

        const filename = `mediahub-audio-${validation.hash.slice(0, 8)}.${format}`;

        c.header('Content-Type', contentTypeMap[format] || 'audio/mpeg');
        c.header('Content-Disposition', `attachment; filename="${filename}"`);
        c.header('Cache-Control', 'no-cache');

        return c.body(webStream);
      }

      // 2. Handle Native Source Stream Downloads
      const provider = ProviderFactory.getProvider(validation.url);
      const { stream, process: childProcess } = await provider.getStream(validation.url, formatId);

      await HistoryService.addHistory({
        userId: user?.id,
        urlHash: validation.hash,
        rawUrl: validation.url,
        title: `Media Stream (${formatId})`,
        platform,
        formatId,
        mediaType: 'COMBINED',
        status: 'SUCCESS',
        ipAddress: ip,
      });

      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (err: Error) => {
            if (!childProcess.killed) childProcess.kill('SIGTERM');
            controller.error(err);
          });
        },
        cancel() {
          if (!childProcess.killed) childProcess.kill('SIGTERM');
        },
      });

      const filename = `mediahub-${validation.hash.slice(0, 8)}.${formatId === 'bestaudio' ? 'mp3' : 'mp4'}`;

      c.header('Content-Type', 'application/octet-stream');
      c.header('Content-Disposition', `attachment; filename="${filename}"`);
      c.header('Cache-Control', 'no-cache');

      return c.body(webStream);
    } catch (err: any) {
      logger.error({ error: err.message, requestId }, 'Error streaming media');
      return c.json({ success: false, code: 'DOWNLOAD_FAILED', message: err.message, timestamp: new Date().toISOString(), requestId }, 500);
    }
  }
}
