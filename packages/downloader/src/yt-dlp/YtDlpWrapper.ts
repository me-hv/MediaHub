import { execFile, spawn, ChildProcess } from 'node:child_process';
import { Readable } from 'node:stream';
import { promisify } from 'node:util';
import fs from 'node:fs';
import { CategorizedQualities, QualityOption, PlaylistMetadata, SubtitleOption } from '@mediahub/types';
import { detectPlatform, normalizeMediaUrl } from '@mediahub/utils';
import { ExecutableResolver } from './ExecutableResolver';

const execFileAsync = promisify(execFile);

export type DownloaderErrorCode =
  | 'INSTAGRAM_RATE_LIMIT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'LOGIN_REQUIRED'
  | 'PRIVATE_POST'
  | 'POST_NOT_FOUND'
  | 'INVALID_URL'
  | 'NETWORK_ERROR'
  | 'YT_DLP_FAILED';

export class DownloaderError extends Error {
  readonly code: DownloaderErrorCode;
  readonly retryAfter?: number;

  constructor(code: DownloaderErrorCode, message: string, retryAfter?: number) {
    super(message);
    this.name = 'DownloaderError';
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export interface YtDlpDumpJsonOutput {
  title?: string;
  uploader?: string;
  uploader_id?: string;
  channel?: string;
  duration?: number;
  thumbnail?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
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

function resolveCookiePath(): string | undefined {
  if (process.env.USE_INSTAGRAM_COOKIES === 'false') return undefined;

  const cookieCandidates = [
    process.env.MEDIAHUB_INSTAGRAM_COOKIES,
    process.env.INSTAGRAM_COOKIES_PATH,
    process.env.MEDIAHUB_COOKIES_PATH,
    './cookies.txt',
  ].filter(Boolean) as string[];

  for (const candidate of cookieCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function classifyError(url: string, rawError: string): DownloaderError {
  const err = (rawError || '').toLowerCase();
  const isInstagram = url.includes('instagram.com') || url.includes('instagr.am');
  const isReddit = url.includes('reddit.com') || url.includes('redd.it');

  if (isInstagram && (err.includes('too many requests') || err.includes('429') || err.includes('rate limit'))) {
    return new DownloaderError(
      'INSTAGRAM_RATE_LIMIT',
      'Instagram is temporarily limiting anonymous requests. Please wait one minute and try again or configure authentication cookies.',
      60
    );
  }

  if (isInstagram && (err.includes('empty media response') || err.includes('login') || err.includes('redirecting to login'))) {
    return new DownloaderError(
      'LOGIN_REQUIRED',
      'This Instagram post or reel requires login to view. Please try another link or configure cookies in settings.'
    );
  }

  if (isReddit && (err.includes('403') || err.includes('forbidden'))) {
    return new DownloaderError(
      'RATE_LIMIT_EXCEEDED',
      'Reddit denied anonymous access. Content may require authentication or updated headers.',
      60
    );
  }

  if (err.includes('private video') || err.includes('private media') || err.includes('login required')) {
    return new DownloaderError('PRIVATE_POST', 'This media is private or restricted.');
  }

  if (err.includes('404') || err.includes('not found') || err.includes('video unavailable') || err.includes('post not found')) {
    return new DownloaderError('POST_NOT_FOUND', 'Media not found at this URL. Content may have been removed or deleted.');
  }

  if (err.includes('unsupported url') || err.includes('no suitable extractor')) {
    return new DownloaderError('INVALID_URL', `This URL is not currently supported: ${url}`);
  }

  if (err.includes('etimedout') || err.includes('econnrefused') || err.includes('unable to download webpage')) {
    return new DownloaderError('NETWORK_ERROR', 'Unable to reach the media provider. Please check network status.');
  }

  return new DownloaderError('YT_DLP_FAILED', 'Failed to extract metadata for URL. Please verify the media is public.');
}

export class YtDlpWrapper {
  static async getVersion(): Promise<string> {
    const resolved = await ExecutableResolver.resolveYtDlp();
    return resolved.version;
  }

  static async dumpJson(rawUrl: string): Promise<YtDlpDumpJsonOutput> {
    const resolved = await ExecutableResolver.resolveYtDlp();

    if (!resolved.available) {
      throw new DownloaderError(
        'YT_DLP_FAILED',
        `yt-dlp executable could not be found on host. Please install yt-dlp, python -m yt_dlp, or set YT_DLP_PATH.`
      );
    }

    const url = normalizeMediaUrl(rawUrl);
    const platform = detectPlatform(url);
    const cookiePath = resolveCookiePath();

    const userAgent =
      process.env.YTDLP_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    const timeoutMs = parseInt(process.env.YTDLP_TIMEOUT || '30000', 10);
    const maxRetries = parseInt(process.env.YTDLP_RETRIES || '3', 10);

    // Exponential backoff delay schedule (Attempt 1: 0s, Attempt 2: 2s, Attempt 3: 5s)
    const backoffDelays = [0, 2000, 5000];

    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (attempt > 1) {
        const delay = backoffDelays[attempt - 1] || 5000;
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[YtDlp Backoff] Waiting ${delay}ms before attempt ${attempt}/${maxRetries} for ${url}`);
        }
        await new Promise((res) => setTimeout(res, delay));
      }

      const extraArgs: string[] = [];

      // Attempt 1: Standard extraction
      if (attempt === 1) {
        extraArgs.push(
          '--user-agent',
          userAgent,
          '--referer',
          'https://www.google.com/',
          '--add-header',
          'Accept-Language: en-US,en;q=0.9'
        );
      }
      // Attempt 2: Platform-specific navigation headers
      else if (attempt === 2) {
        if (platform === 'REDDIT') {
          extraArgs.push(
            '--user-agent',
            userAgent,
            '--referer',
            'https://www.reddit.com/',
            '--add-header',
            'Sec-Fetch-Mode: navigate',
            '--add-header',
            'Sec-Fetch-Site: none'
          );
        } else if (platform === 'INSTAGRAM') {
          extraArgs.push(
            '--user-agent',
            userAgent,
            '--referer',
            'https://www.instagram.com/',
            '--add-header',
            'Sec-Fetch-Site: same-origin',
            '--add-header',
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          );
        } else {
          extraArgs.push('--user-agent', userAgent, '--referer', 'https://www.google.com/');
        }
      }
      // Attempt 3: Cookie authenticated extraction (if file exists)
      else if (attempt >= 3) {
        extraArgs.push('--user-agent', userAgent);
        if (cookiePath) {
          extraArgs.push('--cookies', cookiePath);
        } else {
          extraArgs.push('--referer', 'https://www.google.com/');
        }
      }

      const args = [...resolved.args, ...extraArgs, '--dump-json', '--no-warnings', '--no-playlist', url];
      const startTime = Date.now();

      try {
        const { stdout } = await execFileAsync(resolved.command, args, {
          maxBuffer: 30 * 1024 * 1024,
          timeout: timeoutMs,
        });

        const durationMs = Date.now() - startTime;

        if (process.env.NODE_ENV !== 'production') {
          console.log(`[YtDlp Dev Log] Metadata Extraction Success (Attempt ${attempt}/${maxRetries})`);
          console.log(`  Normalized URL: ${url}`);
          console.log(`  Provider: ${platform}`);
          console.log(`  Command: ${resolved.command} ${args.join(' ')}`);
          console.log(`  Execution Time: ${durationMs}ms`);
        }

        return JSON.parse(stdout) as YtDlpDumpJsonOutput;
      } catch (err: any) {
        lastError = err;
        const durationMs = Date.now() - startTime;

        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[YtDlp Dev Log] Attempt ${attempt}/${maxRetries} Failed`);
          console.warn(`  Normalized URL: ${url}`);
          console.warn(`  Provider: ${platform}`);
          console.warn(`  Command: ${resolved.command} ${args.join(' ')}`);
          console.warn(`  Error: ${err.message || err.stderr}`);
          console.warn(`  Execution Time: ${durationMs}ms`);
        }

        if (err.code === 'ENOENT') {
          throw new DownloaderError(
            'YT_DLP_FAILED',
            `yt-dlp executable could not be executed at '${resolved.displayPath}'. Please verify installation or set YT_DLP_PATH.`
          );
        }
      }
    }

    const rawErrorMsg = lastError?.stderr || lastError?.message || 'yt-dlp extraction error';
    throw classifyError(url, rawErrorMsg);
  }

  static async parsePlaylist(playlistUrl: string): Promise<PlaylistMetadata> {
    const resolved = await ExecutableResolver.resolveYtDlp();

    if (!resolved.available) {
      throw new DownloaderError('YT_DLP_FAILED', `yt-dlp executable could not be found on the host system.`);
    }

    const url = normalizeMediaUrl(playlistUrl);
    const userAgent =
      process.env.YTDLP_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

    try {
      const { stdout } = await execFileAsync(
        resolved.command,
        [...resolved.args, '--user-agent', userAgent, '--flat-playlist', '--dump-single-json', '--no-warnings', url],
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
        rawUrl: url,
        title: json.title || 'Playlist',
        videoCount: items.length,
        items,
      };
    } catch (err: any) {
      throw classifyError(url, err.stderr || err.message);
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

  static async createStream(rawUrl: string, formatId: string): Promise<StreamResult> {
    const resolved = await ExecutableResolver.resolveYtDlp();
    if (!resolved.available) {
      throw new DownloaderError('YT_DLP_FAILED', `yt-dlp executable could not be found for streaming.`);
    }

    const url = normalizeMediaUrl(rawUrl);
    const userAgent =
      process.env.YTDLP_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    const cookiePath = resolveCookiePath();

    const extraArgs = ['--user-agent', userAgent, '--referer', 'https://www.google.com/'];
    if (cookiePath) extraArgs.push('--cookies', cookiePath);

    const args = [...resolved.args, ...extraArgs, '-f', formatId, '-o', '-', '--no-warnings', '--no-playlist', url];
    const child = spawn(resolved.command, args);
    return {
      stream: child.stdout,
      process: child,
    };
  }

  static async createAudioExtractStream(rawUrl: string, audioFormat: 'mp3' | 'm4a' | 'aac'): Promise<StreamResult> {
    const resolved = await ExecutableResolver.resolveYtDlp();
    if (!resolved.available) {
      throw new DownloaderError('YT_DLP_FAILED', `yt-dlp executable could not be found for audio extraction.`);
    }

    const url = normalizeMediaUrl(rawUrl);
    const userAgent =
      process.env.YTDLP_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    const cookiePath = resolveCookiePath();

    const extraArgs = ['--user-agent', userAgent, '--referer', 'https://www.google.com/'];
    if (cookiePath) extraArgs.push('--cookies', cookiePath);

    const args = [...resolved.args, ...extraArgs, '-x', '--audio-format', audioFormat, '-o', '-', '--no-warnings', '--no-playlist', url];
    const child = spawn(resolved.command, args);
    return {
      stream: child.stdout,
      process: child,
    };
  }
}
