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
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[YtDlpWrapper] Native yt-dlp binary not installed. Generating simulated metadata for: ${url}`);
        return this.getMockMetadata(url);
      }
      throw new Error(
        `yt-dlp executable could not be found. Please install yt-dlp or configure YT_DLP_PATH environment variable. See docs/development.md`
      );
    }

    let lastError: any;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { stdout } = await execFileAsync(
          resolved.path,
          ['--dump-json', '--no-warnings', '--no-playlist', url],
          { maxBuffer: 15 * 1024 * 1024 }
        );
        return JSON.parse(stdout) as YtDlpDumpJsonOutput;
      } catch (err: any) {
        lastError = err;
        if (err.code === 'ENOENT') {
          throw new Error(
            `yt-dlp executable could not be found at path '${resolved.path}'. Please install yt-dlp or configure YT_DLP_PATH. See docs/development.md`
          );
        }
        if (attempt < retries) {
          await new Promise((res) => setTimeout(res, delayMs * attempt));
        }
      }
    }
    throw new Error(`Failed to extract media metadata after ${retries} attempts: ${lastError?.message || 'yt-dlp process error'}`);
  }

  static async parsePlaylist(playlistUrl: string): Promise<PlaylistMetadata> {
    const resolved = await ExecutableResolver.resolveYtDlp();

    if (!resolved.available) {
      if (process.env.NODE_ENV !== 'production') {
        return {
          rawUrl: playlistUrl,
          title: 'Simulated Demo Playlist',
          videoCount: 3,
          items: [
            { id: 'v1', title: 'Video Item 1', rawUrl: `${playlistUrl}&v=1`, duration: 210, position: 1 },
            { id: 'v2', title: 'Video Item 2', rawUrl: `${playlistUrl}&v=2`, duration: 180, position: 2 },
            { id: 'v3', title: 'Video Item 3', rawUrl: `${playlistUrl}&v=3`, duration: 320, position: 3 },
          ],
        };
      }
      throw new Error(`yt-dlp executable could not be found. Please install yt-dlp or configure YT_DLP_PATH. See docs/development.md`);
    }

    try {
      const { stdout } = await execFileAsync(
        resolved.path,
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

  static async createStream(url: string, formatId: string): Promise<StreamResult> {
    const resolved = await ExecutableResolver.resolveYtDlp();
    const bin = resolved.available ? resolved.path : 'yt-dlp';
    const args = ['-f', formatId, '-o', '-', '--no-warnings', '--no-playlist', url];
    const child = spawn(bin, args);
    return {
      stream: child.stdout,
      process: child,
    };
  }

  static async createAudioExtractStream(url: string, audioFormat: 'mp3' | 'm4a' | 'aac'): Promise<StreamResult> {
    const resolved = await ExecutableResolver.resolveYtDlp();
    const bin = resolved.available ? resolved.path : 'yt-dlp';
    const args = ['-x', '--audio-format', audioFormat, '-o', '-', '--no-warnings', '--no-playlist', url];
    const child = spawn(bin, args);
    return {
      stream: child.stdout,
      process: child,
    };
  }

  private static getMockMetadata(url: string): YtDlpDumpJsonOutput {
    return {
      title: 'MediaHub Demo Video - High Performance Stream',
      uploader: 'MediaHub Content Engine',
      duration: 215,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop',
      view_count: 142850,
      upload_date: '20260101',
      description: 'Simulated high-quality stream metadata generated by MediaHub Universal Engine.',
      formats: [
        { format_id: '22', ext: 'mp4', resolution: '720p', format_note: '720p HD', filesize: 45000000, height: 720, width: 1280, vcodec: 'h264', acodec: 'aac' },
        { format_id: '137', ext: 'mp4', resolution: '1080p', format_note: '1080p Full HD', filesize: 120000000, height: 1080, width: 1920, vcodec: 'h264', acodec: 'none' },
        { format_id: '140', ext: 'm4a', resolution: 'audio only', format_note: '128k Audio', filesize: 5000000, vcodec: 'none', acodec: 'aac' },
      ],
      subtitles: {
        en: [{ ext: 'vtt', url: 'https://example.com/sub_en.vtt', name: 'English' }],
      },
    };
  }
}
