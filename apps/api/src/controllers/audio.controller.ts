import { Context } from 'hono';
import { sanitizeAndValidateUrl, detectPlatform } from '@mediahub/utils';
import { ProviderFactory, YtDlpWrapper } from '@mediahub/downloader';
import { AudioAnalyzer, FFmpegManager, MetadataWriter, AlbumProcessor, AudioTranscodeOptions, AudioFormat } from '@mediahub/audio';
import { logger } from '../utils/logger';
import type { AppEnv } from '../app';

export class AudioController {
  static async analyzeAudio(c: Context<AppEnv>) {
    const requestId = c.get('requestId') || 'req-unknown';
    const body = await c.req.json();
    const validation = sanitizeAndValidateUrl(body?.url);

    if (!validation.success) {
      return c.json({ success: false, code: 'INVALID_URL', message: validation.error, timestamp: new Date().toISOString(), requestId }, 400);
    }

    try {
      const audioAnalysis = AudioAnalyzer.analyzeUrl(validation.url);
      const metadata = await ProviderFactory.getProvider(validation.url).extractMetadata(validation.url, validation.hash);

      const waveform = await FFmpegManager.generateWaveformJson(80);

      return c.json({
        success: true,
        data: {
          metadata,
          audioAnalysis,
          waveform,
          availableFormats: [
            { format: 'mp3', bitrates: ['320', '256', '192', '160', '128'], defaultBitrate: '320' },
            { format: 'flac', bitDepths: ['16', '24'], defaultBitDepth: '16' },
            { format: 'wav', bitDepths: ['16', '24', '32'], defaultBitDepth: '16' },
            { format: 'aac', bitrates: ['320', '256', '192', '128'], defaultBitrate: '256' },
            { format: 'opus', bitrates: ['192', '160', '128', '96', '64'], defaultBitrate: '160' },
            { format: 'm4a', bitrates: ['320', '256', '128'], defaultBitrate: '256' },
          ],
        },
        timestamp: new Date().toISOString(),
        requestId,
      });
    } catch (err: any) {
      logger.error({ error: err.message, requestId }, 'Error in audio analysis');
      return c.json({ success: false, code: 'AUDIO_ANALYZE_FAILED', message: err.message, timestamp: new Date().toISOString(), requestId }, 500);
    }
  }

  static async downloadAudio(c: Context<AppEnv>) {
    const requestId = c.get('requestId') || 'req-unknown';
    const body = await c.req.json();
    const validation = sanitizeAndValidateUrl(body?.url);

    if (!validation.success) {
      return c.json({ success: false, code: 'INVALID_URL', message: validation.error, timestamp: new Date().toISOString(), requestId }, 400);
    }

    const format = (body?.format || 'mp3') as AudioFormat;
    const bitrate = body?.bitrate || '320';
    const bitDepth = body?.bitDepth || '16';
    const normalizeLoudness = !!body?.normalizeLoudness;

    try {
      const { stream, process: childProcess } = await YtDlpWrapper.createAudioExtractStream(validation.url, format === 'm4a' ? 'm4a' : 'mp3');

      const transcodeOpts: AudioTranscodeOptions = {
        format,
        bitrate,
        bitDepth,
        normalizeLoudness,
      };

      const { stream: transcodeStream, process: ffmpegProc } = await FFmpegManager.createTranscodeProcess(stream, transcodeOpts);

      const webStream = new ReadableStream({
        start(controller) {
          transcodeStream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
          transcodeStream.on('end', () => controller.close());
          transcodeStream.on('error', (err: Error) => {
            if (!childProcess.killed) childProcess.kill('SIGTERM');
            if (!ffmpegProc.killed) ffmpegProc.kill('SIGTERM');
            controller.error(err);
          });
        },
        cancel() {
          if (!childProcess.killed) childProcess.kill('SIGTERM');
          if (!ffmpegProc.killed) ffmpegProc.kill('SIGTERM');
        },
      });

      const contentTypeMap: Record<string, string> = {
        mp3: 'audio/mpeg',
        flac: 'audio/flac',
        wav: 'audio/wav',
        aac: 'audio/aac',
        m4a: 'audio/mp4',
        opus: 'audio/opus',
        ogg: 'audio/ogg',
      };

      const filename = `audio-${validation.hash.slice(0, 8)}.${format}`;

      c.header('Content-Type', contentTypeMap[format] || 'audio/mpeg');
      c.header('Content-Disposition', `attachment; filename="${filename}"`);
      c.header('Cache-Control', 'no-cache');

      return c.body(webStream);
    } catch (err: any) {
      logger.error({ error: err.message, requestId }, 'Error extracting/transcoding audio');
      return c.json({ success: false, code: 'AUDIO_DOWNLOAD_FAILED', message: err.message, timestamp: new Date().toISOString(), requestId }, 500);
    }
  }

  static async getAlbumDetails(c: Context<AppEnv>) {
    const requestId = c.get('requestId') || 'req-unknown';
    const body = await c.req.json();
    const validation = sanitizeAndValidateUrl(body?.url);

    if (!validation.success) {
      return c.json({ success: false, code: 'INVALID_URL', message: validation.error, timestamp: new Date().toISOString(), requestId }, 400);
    }

    try {
      const playlistData = await YtDlpWrapper.parsePlaylist(validation.url);
      const tracks = playlistData.items.map((item) => ({
        id: item.id,
        title: item.title,
        artist: playlistData.title.split('-')[0]?.trim() || 'Artist',
        duration: item.duration || 180,
        trackNumber: item.position,
        url: item.rawUrl,
        thumbnail: item.thumbnail,
        selected: true,
      }));

      const album = {
        id: validation.hash.slice(0, 12),
        title: playlistData.title,
        artist: playlistData.title.split('-')[0]?.trim() || 'Artist',
        totalTracks: tracks.length,
        tracks,
      };

      return c.json({ success: true, data: { album }, timestamp: new Date().toISOString(), requestId });
    } catch (err: any) {
      return c.json({ success: false, code: 'ALBUM_ANALYZE_FAILED', message: err.message, timestamp: new Date().toISOString(), requestId }, 500);
    }
  }
}
