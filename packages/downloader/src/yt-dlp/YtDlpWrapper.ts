import { execFile, spawn, ChildProcess } from 'node:child_process';
import { Readable } from 'node:stream';
import { promisify } from 'node:util';
import { CategorizedQualities, QualityOption, PlaylistMetadata, SubtitleOption } from '@mediahub/types';

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
  private static executable = 'yt-dlp';

  static async getVersion(): Promise<string> {
    try {
      const { stdout } = await execFileAsync(this.executable, ['--version']);
      return stdout.trim();
    } catch {
      return 'unavailable';
    }
  }

  static async dumpJson(url: string, retries = 2, delayMs = 1000): Promise<YtDlpDumpJsonOutput> {
    let lastError: any;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { stdout } = await execFileAsync(
          this.executable,
          ['--dump-json', '--no-warnings', '--no-playlist', url],
          { maxBuffer: 15 * 1024 * 1024 }
        );
        return JSON.parse(stdout) as YtDlpDumpJsonOutput;
      } catch (err: any) {
        lastError = err;
        if (attempt < retries) {
          await new Promise((res) => setTimeout(res, delayMs * attempt));
        }
      }
    }
    throw new Error(`Failed to extract media metadata after ${retries} attempts: ${lastError?.message || 'yt-dlp process error'}`);
  }

  static async parsePlaylist(playlistUrl: string): Promise<PlaylistMetadata> {
    try {
      const { stdout } = await execFileAsync(
        this.executable,
        ['--flat-playlist', '--dump-single-json', '--no-warnings', playlistUrl],
        { maxBuffer: 20 * 1024 * 1024 }
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
      throw new Error(`Failed to parse playlist: ${err.message || 'Invalid or private playlist'}`);
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
      video: video.slice(-8),
      audio: audio.slice(-5),
      combined: combined.slice(-8),
    };
  }

  static createStream(url: string, formatId: string): StreamResult {
    const args = ['-f', formatId, '-o', '-', '--no-warnings', '--no-playlist', url];
    const child = spawn(this.executable, args);
    return {
      stream: child.stdout,
      process: child,
    };
  }

  static createAudioExtractStream(url: string, audioFormat: 'mp3' | 'm4a' | 'aac'): StreamResult {
    const args = ['-x', '--audio-format', audioFormat, '-o', '-', '--no-warnings', '--no-playlist', url];
    const child = spawn(this.executable, args);
    return {
      stream: child.stdout,
      process: child,
    };
  }
}
