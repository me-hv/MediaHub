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
  channel?: string;
  duration?: number;
  thumbnail?: string;
  view_count?: number;
  like_count?: number;
  upload_date?: string;
  description?: string;
  width?: number;
  height?: number;
  aspect_ratio?: number;
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
    tbr?: number;
    vbr?: number;
    abr?: number;
    dynamic_range?: string;
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

function calculateAspectRatio(w?: number, h?: number): string | undefined {
  if (!w || !h || w <= 0 || h <= 0) return undefined;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(w, h);
  const num = w / divisor;
  const den = h / divisor;
  if (num === 16 && den === 9) return '16:9';
  if (num === 9 && den === 16) return '9:16';
  if (num === 4 && den === 3) return '4:3';
  if (num === 3 && den === 4) return '3:4';
  if (num === 1 && den === 1) return '1:1';
  return `${num}:${den}`;
}

function calculateEstimatedFilesize(duration?: number, tbr?: number, vbr?: number, abr?: number): number | undefined {
  const bitrate = tbr || (vbr || 0) + (abr || 0);
  if (!duration || duration <= 0 || !bitrate || bitrate <= 0) return undefined;
  return Math.round(((bitrate * 1000) / 8) * duration);
}

const DEFAULT_YTDLP_HEADERS = [
  '--user-agent',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  '--referer',
  'https://www.google.com/',
  '--add-header',
  'Accept-Language: en-US,en;q=0.9',
];

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
          [...resolved.args, ...DEFAULT_YTDLP_HEADERS, '--dump-json', '--no-warnings', '--no-playlist', url],
          { maxBuffer: 30 * 1024 * 1024 }
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

    const errorMsg = lastError?.message || 'yt-dlp extraction error';
    if (errorMsg.includes('Unsupported URL')) {
      throw new Error(`Unsupported media URL or format. Please verify the URL: ${url}`);
    }
    if (errorMsg.includes('Private video') || errorMsg.includes('login')) {
      throw new Error(`This media is private or requires account login.`);
    }
    if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
      throw new Error(`Media not found at ${url}. Content may have been removed or deleted.`);
    }

    throw new Error(`Failed to extract media metadata for URL '${url}' after ${retries} attempts: ${errorMsg}`);
  }

  static async parsePlaylist(playlistUrl: string): Promise<PlaylistMetadata> {
    const resolved = await ExecutableResolver.resolveYtDlp();

    if (!resolved.available) {
      throw new Error(`yt-dlp executable could not be found on the host system. Please install yt-dlp or set YT_DLP_PATH. See docs/development.md`);
    }

    try {
      const { stdout } = await execFileAsync(
        resolved.command,
        [...resolved.args, ...DEFAULT_YTDLP_HEADERS, '--flat-playlist', '--dump-single-json', '--no-warnings', playlistUrl],
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

  static categorizeFormats(rawFormats: YtDlpDumpJsonOutput['formats'] = [], overallDuration?: number): CategorizedQualities {
    const video: QualityOption[] = [];
    const audio: QualityOption[] = [];
    const combined: QualityOption[] = [];

    for (const fmt of rawFormats) {
      if (!fmt.format_id) continue;

      const hasVideo = !!(fmt.vcodec && fmt.vcodec !== 'none');
      const hasAudio = !!(fmt.acodec && fmt.acodec !== 'none');

      if (!hasVideo && !hasAudio) continue;

      const resolution = fmt.resolution || (fmt.width && fmt.height ? `${fmt.width}×${fmt.height}` : fmt.height ? `${fmt.height}p` : undefined);
      const filesize = fmt.filesize;
      const filesizeApprox = fmt.filesize_approx;
      const filesizeEstimated = !filesize && !filesizeApprox ? calculateEstimatedFilesize(overallDuration, fmt.tbr, fmt.vbr, fmt.abr) : undefined;

      const aspectRatio = calculateAspectRatio(fmt.width, fmt.height);
      const isHdr = !!(fmt.dynamic_range && (fmt.dynamic_range.includes('HDR') || fmt.dynamic_range.includes('DV') || fmt.dynamic_range.includes('HLG')));

      const option: QualityOption = {
        formatId: fmt.format_id,
        ext: fmt.ext || 'mp4',
        resolution,
        width: fmt.width,
        height: fmt.height,
        aspectRatio,
        filesize,
        filesizeApprox,
        filesizeEstimated,
        qualityLabel: fmt.format_note || resolution || (hasAudio && !hasVideo ? 'Audio Only' : 'Standard'),
        hasVideo,
        hasAudio,
        category: hasVideo && hasAudio ? 'combined' : hasVideo ? 'video' : 'audio',
        fps: fmt.fps,
        vcodec: fmt.vcodec,
        acodec: fmt.acodec,
        tbr: fmt.tbr,
        hdr: isHdr,
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

    const args = [...resolved.args, ...DEFAULT_YTDLP_HEADERS, '-f', formatId, '-o', '-', '--no-warnings', '--no-playlist', url];
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

    const args = [...resolved.args, ...DEFAULT_YTDLP_HEADERS, '-x', '--audio-format', audioFormat, '-o', '-', '--no-warnings', '--no-playlist', url];
    const child = spawn(resolved.command, args);
    return {
      stream: child.stdout,
      process: child,
    };
  }
}
