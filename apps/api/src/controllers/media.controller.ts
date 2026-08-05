import { Context } from 'hono';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
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
      // 1. Stage-Gated File-Based Audio Conversion Pipeline (conv-*)
      if (formatId.startsWith('conv-')) {
        let format: AudioFormat = 'mp3';
        let bitrate = '320';
        let ext = 'mp3';

        if (formatId.includes('flac')) {
          format = 'flac';
          ext = 'flac';
        } else if (formatId.includes('wav')) {
          format = 'wav';
          ext = 'wav';
        } else if (formatId.includes('aac')) {
          format = 'm4a';
          ext = 'm4a';
          bitrate = formatId.split('-')[2] || '256';
        } else if (formatId.includes('ogg')) {
          format = 'ogg';
          ext = 'ogg';
        } else if (formatId.includes('mp3')) {
          format = 'mp3';
          ext = 'mp3';
          bitrate = formatId.split('-')[2] || '320';
        }

        const tempDir = path.join(os.tmpdir(), 'mediahub-conversions');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const jobId = crypto.randomUUID();
        const sourcePath = path.join(tempDir, `${jobId}-source.m4a`);
        const outputPath = path.join(tempDir, `${jobId}-converted.${ext}`);

        console.log(`[Stage 1/4 - Download] Starting yt-dlp download for ${validation.url}`);
        console.log(`  Job ID: ${jobId}`);
        console.log(`  Target Source File: ${sourcePath}`);

        // STAGE 1: Download bestaudio to disk
        const sourceResult = await YtDlpWrapper.downloadAudioToFile(validation.url, sourcePath);

        if (!fs.existsSync(sourcePath) || sourceResult.size === 0) {
          return c.json(
            {
              success: false,
              stage: 'yt-dlp',
              code: 'SOURCE_DOWNLOAD_FAILED',
              message: 'yt-dlp failed to download source audio file.',
              timestamp: new Date().toISOString(),
              requestId,
            },
            500
          );
        }

        console.log(`[Stage 2/4 - Conversion] Starting FFmpeg conversion: M4A -> ${format.toUpperCase()}`);
        console.log(`  Source File: ${sourcePath} (${(sourceResult.size / 1024 / 1024).toFixed(2)} MB)`);
        console.log(`  Target Output: ${outputPath}`);

        // STAGE 2: Execute FFmpeg file-to-file conversion & wait for completion
        const transResult = await FFmpegManager.transcodeFileToFile(sourcePath, outputPath, { format, bitrate });

        // STAGE 3: Strict non-zero file verification before HTTP response
        if (!fs.existsSync(outputPath) || transResult.size === 0) {
          try { if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath); } catch {}
          try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}

          return c.json(
            {
              success: false,
              stage: 'ffmpeg',
              code: 'CONVERSION_FAILED',
              message: `FFmpeg generated a 0-byte or invalid output file for format ${format.toUpperCase()}.`,
              timestamp: new Date().toISOString(),
              requestId,
            },
            500
          );
        }

        const finalStat = fs.statSync(outputPath);
        console.log(`[Stage 3/4 - Verified Output] Final converted output size: ${finalStat.size} bytes (${(finalStat.size / 1024 / 1024).toFixed(2)} MB)`);

        const contentTypeMap: Record<string, string> = {
          mp3: 'audio/mpeg',
          flac: 'audio/flac',
          wav: 'audio/wav',
          m4a: 'audio/mp4',
          ogg: 'audio/ogg',
        };

        const filename = `mediahub-audio-${validation.hash.slice(0, 8)}.${ext}`;

        // STAGE 4: HTTP Streaming & Cleanup
        console.log(`[Stage 4/4 - Streaming] Sending ${filename} with Content-Length: ${finalStat.size}`);

        const fileStream = fs.createReadStream(outputPath);

        const webStream = new ReadableStream({
          start(controller) {
            fileStream.on('data', (chunk: Buffer | string) => controller.enqueue(typeof chunk === 'string' ? Buffer.from(chunk) : chunk));
            fileStream.on('end', () => {
              controller.close();
              console.log(`[Cleanup] Deleting temporary files for job ${jobId}`);
              try { if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath); } catch {}
              try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
            });
            fileStream.on('error', (err: Error) => {
              controller.error(err);
              try { if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath); } catch {}
              try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
            });
          },
          cancel() {
            fileStream.destroy();
            try { if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath); } catch {}
            try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
          },
        });

        c.header('Content-Type', contentTypeMap[ext] || 'audio/mpeg');
        c.header('Content-Length', finalStat.size.toString());
        c.header('Content-Disposition', `attachment; filename="${filename}"`);
        c.header('Cache-Control', 'no-cache');

        await HistoryService.addHistory({
          userId: user?.id,
          urlHash: validation.hash,
          rawUrl: validation.url,
          title: `Converted Audio (${ext.toUpperCase()})`,
          platform,
          formatId,
          mediaType: 'AUDIO',
          status: 'SUCCESS',
          ipAddress: ip,
        });

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
      logger.error({ error: err.message, requestId }, 'Error downloading media');
      return c.json({ success: false, code: 'DOWNLOAD_FAILED', message: err.message, timestamp: new Date().toISOString(), requestId }, 500);
    }
  }
}
