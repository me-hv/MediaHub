import { execFile, spawn, ChildProcess } from 'node:child_process';
import { Readable } from 'node:stream';
import { promisify } from 'node:util';
import { CategorizedQualities, QualityOption, PlaylistMetadata, SubtitleOption } from '@mediahub/types';
import { ExecutableResolver } from './ExecutableResolver';

const execFileAsync = promisify(execFile);

export interface YtDlpDumpJsonOutput {
  title?: string;
  uploader?: string;
  uploader_id?: string;
  duration?: number;
  thumbnail?: string;
  view_count?: number;
  upload_date?: string;
  description?: string;
  formats?: Array<{
    format_id: string;
    ext: string;
    resolution?: string;
    format_note?: string;
    filesize?: number;
    filesize_approx?: number;
    fps?: number;
    vcodec?: string;
    acodec?: string;
    height?: number;
    width?: number;
  }>;
  subtitles?: Record<string, Array<{ ext: string; url: string; name?: string }>>;
  entries?: Array<{
    id: string;
    title?: string;
    url?: string;
    duration?: number;
    uploader?: string;
  }>;
}

export interface StreamResult {
  stream: Readable;
  process: ChildProcess;
}

export class YtDlpWrapper {
  static async getVersion(): Promise<string> {
    const resolved = await ExecutableResolver.resolveYtDlp();
    return resolved.version;
  }

  static async dumpJson(url: string, retries = 2, delayMs = 1000): Promise<YtDlpDumpJsonOutput> {
    const resolved = await ExecutableResolver.resolveYtDlp();

    if (!resolved.available) {
      throw new Error(
        `yt-dlp executable could not be found on the host system. Please install yt-dlp, python -m yt_dlp, or set YT_DLP_PATH. See docs/development.md`
      );
    }

    let lastError: any;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { stdout } = await execFileAsync(
          resolved.command,
          [...resolved.args, '--dump-json', '--no-warnings', '--no-playlist', url],
          { maxBuffer: 25 * 1024 * 1024 }
        );
        return JSON.parse(stdout) as YtDlpDumpJsonOutput;
      } catch (err: any) {
        lastError = err;
        if (err.code === 'ENOENT') {
          throw new Error(
            `yt-dlp executable could not be executed at '${resolved.displayPath}'. Please verify installation or set YT_DLP_PATH. See docs/development.md`
          );
        }
        if (attempt < retries) {
          await new Promise((res) => setTimeout(res, delayMs * attempt));
        }
      }
    }
    throw new Error(`Failed to extract media metadata for URL '${url}' after ${retries} attempts: ${lastError?.message || 'yt-dlp extraction error'}`);
  }

  static async parsePlaylist(playlistUrl: string): Promise<PlaylistMetadata> {
    const resolved = await ExecutableResolver.resolveYtDlp();

    if (!resolved.available) {
      throw new Error(`yt-dlp executable could not be found on the host system. Please install yt-dlp or set YT_DLP_PATH. See docs/development.md`);
    }

    try {
      const { stdout } = await execFileAsync(
        resolved.command,
        [...resolved.args, '--flat-playlist', '--dump-single-json', '--no-warnings', playlistUrl],
        { maxBuffer: 30 * 1024 * 1024 }
      );
      const json = JSON.parse(stdout) as YtDlpDumpJsonOutput;
      const entries = json.entries || [];

      const items = entries.map((entry, index) => ({
        id: entry.id,
        title: entry.title || `Video ${index + 1}`,
        rawUrl: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
        duration: entry.duration,
        position: index + 1,
      }));

      return {
        rawUrl: playlistUrl,
        title: json.title || 'YouTube Playlist',
        videoCount: items.length,
        items,
      };
    } catch (err: any) {
      throw new Error(`Failed to parse playlist '${playlistUrl}': ${err.message || 'Invalid or private playlist'}`);
    }
  }

  static async fetchSubtitles(url: string): Promise<SubtitleOption[]> {
    try {
      const json = await this.dumpJson(url);
      const subs = json.subtitles || {};
      const result: SubtitleOption[] = [];

      for (const [langKey, formats] of Object.entries(subs)) {
        for (const fmt of formats) {
          if (['vtt', 'srt', 'json3', 'json'].includes(fmt.ext)) {
            result.push({
              language: fmt.name || langKey,
              languageCode: langKey,
              format: fmt.ext === 'json3' ? 'json' : (fmt.ext as 'vtt' | 'srt' | 'json'),
              url: fmt.url,
            });
          }
        }
      }

      return result;
    } catch {
      return [];
    }
  }

  static categorizeFormats(rawFormats: YtDlpDumpJsonOutput['formats'] = []): CategorizedQualities {
    const video: QualityOption[] = [];
    const audio: QualityOption[] = [];
    const combined: QualityOption[] = [];

    for (const fmt of rawFormats) {
      if (!fmt.format_id) continue;

      const hasVideo = !!(fmt.vcodec && fmt.vcodec !== 'none');
      const hasAudio = !!(fmt.acodec && fmt.acodec !== 'none');

      if (!hasVideo && !hasAudio) continue;

      const resolution = fmt.resolution || (fmt.height ? `${fmt.height}p` : undefined);
      const filesize = fmt.filesize || fmt.filesize_approx;

      const option: QualityOption = {
        formatId: fmt.format_id,
        ext: fmt.ext || 'mp4',
        resolution,
        filesize,
        qualityLabel: fmt.format_note || resolution || (hasAudio && !hasVideo ? 'Audio Only' : 'Standard'),
        hasVideo,
        hasAudio,
        category: hasVideo && hasAudio ? 'combined' : hasVideo ? 'video' : 'audio',
        fps: fmt.fps,
        vcodec: fmt.vcodec,
        acodec: fmt.acodec,
      };

      if (hasVideo && hasAudio) {
        combined.push(option);
      } else if (hasVideo) {
        video.push(option);
      } else if (hasAudio) {
        audio.push(option);
      }
    }

    return {
      video: video.slice(-12),
      audio: audio.slice(-8),
      combined: combined.slice(-12),
    };
  }

  static async createStream(url: string, formatId: string): Promise<StreamResult> {
    const resolved = await ExecutableResolver.resolveYtDlp();
    if (!resolved.available) {
      throw new Error(`yt-dlp executable could not be found for streaming. Please install yt-dlp or set YT_DLP_PATH. See docs/development.md`);
    }

    const args = [...resolved.args, '-f', formatId, '-o', '-', '--no-warnings', '--no-playlist', url];
    const child = spawn(resolved.command, args);
    return {
      stream: child.stdout,
      process: child,
    };
  }

  static async createAudioExtractStream(url: string, audioFormat: 'mp3' | 'm4a' | 'aac'): Promise<StreamResult> {
    const resolved = await ExecutableResolver.resolveYtDlp();
    if (!resolved.available) {
      throw new Error(`yt-dlp executable could not be found for audio extraction. Please install yt-dlp or set YT_DLP_PATH. See docs/development.md`);
    }

    const args = [...resolved.args, '-x', '--audio-format', audioFormat, '-o', '-', '--no-warnings', '--no-playlist', url];
    const child = spawn(resolved.command, args);
    return {
      stream: child.stdout,
      process: child,
    };
  }
}
