import { Context } from 'hono';
import { sanitizeAndValidateUrl, detectPlatform } from '@mediahub/utils';
import { ProviderFactory, YtDlpWrapper, DownloaderError } from '@mediahub/downloader';
import { FFmpegManager, AudioFormat } from '@mediahub/audio';
import { HistoryService } from '../services/history.service';
import { logger } from '../utils/logger';
import { AppEnv } from '../app';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

export class MediaController {
  static async analyzeMedia(c: Context<AppEnv>) {
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

    const url = validation.url;
    const platform = detectPlatform(url);

    console.log(`[ANALYZE] Request Received (${requestId}) | URL: ${url} | Detected Platform: ${platform}`);

    const provider = ProviderFactory.getProvider(url);

    try {
      console.log(`[ANALYZE] Executing metadata extraction via provider: ${provider.name}`);
      const result = await provider.extractMetadataResult!(url, validation.hash);

      if (!result.success) {
        const error = result.error as DownloaderError;
        console.error(`[ANALYZE] Extraction failed for ${url}: ${error.message} (Code: ${error.code})`);
        return c.json(
          {
            success: false,
            code: error.code || 'EXTRACTION_FAILED',
            message: error.message,
            retryAfter: error.retryAfter,
            timestamp: new Date().toISOString(),
            requestId,
          },
          error.code === 'POST_NOT_FOUND' ? 404 : error.code === 'PRIVATE_POST' ? 403 : error.code?.includes('RATE_LIMIT') ? 429 : 500
        );
      }

      console.log(`[ANALYZE] Metadata Extracted Successfully: "${result.metadata.title}" | Formats: Video(${result.metadata.qualities.video.length}), Audio(${result.metadata.qualities.audio.length}), Combined(${result.metadata.qualities.combined.length})`);

      await HistoryService.addHistory({
        userId: user?.id,
        urlHash: validation.hash,
        rawUrl: url,
        title: result.metadata.title,
        platform: result.metadata.platform,
        formatId: 'analyze',
        status: 'SUCCESS',
      });

      // Maintain exact contract: { success: true, data: { metadata: result.metadata } }
      return c.json({
        success: true,
        data: {
          metadata: result.metadata,
        },
        timestamp: new Date().toISOString(),
        requestId,
      });
    } catch (err: any) {
      console.error(`[ANALYZE] Unexpected Server Error during analysis: ${err.message}`);
      logger.error({ error: err.message, requestId }, 'Error analyzing media');
      return c.json({ success: false, code: 'ANALYSIS_FAILED', message: err.message || 'An unexpected server error occurred.', timestamp: new Date().toISOString(), requestId }, 500);
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
      // 1. Stage-Gated Audio Conversion Pipeline (conv-*)
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

      // 2. Stage-Gated Native Source Media Downloads (Disk-Verified)
      const tempDir = path.join(os.tmpdir(), 'mediahub-downloads');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const jobId = crypto.randomUUID();
      const ext = formatId === 'bestaudio' ? 'mp3' : 'mp4';
      const targetPath = path.join(tempDir, `${jobId}-media.${ext}`);

      console.log(`[Stage 1/3 - Download] Starting native download for ${validation.url}`);
      console.log(`  Job ID: ${jobId}`);
      console.log(`  Format ID: ${formatId}`);
      console.log(`  Target Path: ${targetPath}`);

      const downloadResult = await YtDlpWrapper.downloadMediaToFile(validation.url, formatId, targetPath);

      // STAGE 2: Non-zero file verification before HTTP response
      if (!fs.existsSync(targetPath) || downloadResult.size === 0) {
        try { if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath); } catch {}

        return c.json(
          {
            success: false,
            stage: 'yt-dlp',
            code: 'DOWNLOADED_FILE_EMPTY',
            message: 'Downloaded media file is 0 bytes or was not created.',
            timestamp: new Date().toISOString(),
            requestId,
          },
          500
        );
      }

      const finalStat = fs.statSync(targetPath);
      const filename = `mediahub-${validation.hash.slice(0, 8)}.${ext}`;

      console.log(`[Stage 2/3 - Verified Output] Size: ${finalStat.size} bytes (${(finalStat.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`[Stage 3/3 - Streaming] Sending ${filename} with Content-Length: ${finalStat.size}`);

      const fileStream = fs.createReadStream(targetPath);

      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk: Buffer | string) => controller.enqueue(typeof chunk === 'string' ? Buffer.from(chunk) : chunk));
          fileStream.on('end', () => {
            controller.close();
            console.log(`[Cleanup] Deleting temporary file for job ${jobId}`);
            try { if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath); } catch {}
          });
          fileStream.on('error', (err: Error) => {
            controller.error(err);
            try { if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath); } catch {}
          });
        },
        cancel() {
          fileStream.destroy();
          try { if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath); } catch {}
        },
      });

      c.header('Content-Type', ext === 'mp3' ? 'audio/mpeg' : 'video/mp4');
      c.header('Content-Length', finalStat.size.toString());
      c.header('Content-Disposition', `attachment; filename="${filename}"`);
      c.header('Cache-Control', 'no-cache');

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

      return c.body(webStream);
    } catch (err: any) {
      logger.error({ error: err.message, requestId }, 'Error downloading media');
      return c.json({ success: false, code: err.code || 'DOWNLOAD_FAILED', message: err.message, timestamp: new Date().toISOString(), requestId }, 500);
    }
  }
}
