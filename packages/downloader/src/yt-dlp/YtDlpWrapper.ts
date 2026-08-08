import { execFile, spawn, ChildProcess } from 'node:child_process';
import { Readable } from 'node:stream';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { CategorizedQualities, QualityOption, PlaylistMetadata, SubtitleOption, PlatformType } from '@mediahub/types';
import { detectPlatform, normalizeMediaUrl } from '@mediahub/utils';
import { ExecutableResolver } from './ExecutableResolver';
import { NormalizerFactory } from '../normalizers/NormalizerFactory';

const execFileAsync = promisify(execFile);

export type DownloaderErrorCode =
  | 'YOUTUBE_RATE_LIMIT'
  | 'INSTAGRAM_RATE_LIMIT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'LOGIN_REQUIRED'
  | 'PRIVATE_POST'
  | 'POST_NOT_FOUND'
  | 'INVALID_URL'
  | 'NETWORK_ERROR'
  | 'DOWNLOAD_FILE_NOT_CREATED'
  | 'DOWNLOADED_FILE_EMPTY'
  | 'YT_DLP_FAILED';

export class DownloaderError extends Error {
  readonly code: DownloaderErrorCode;
  readonly retryAfter?: number;
  readonly originalStderr?: string;

  constructor(code: DownloaderErrorCode, message: string, retryAfter?: number, originalStderr?: string) {
    super(message);
    this.name = 'DownloaderError';
    this.code = code;
    this.retryAfter = retryAfter;
    this.originalStderr = originalStderr;
  }
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
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

function resolveCookiePath(): string | undefined {
  if (process.env.USE_YOUTUBE_COOKIES === 'false' && process.env.USE_INSTAGRAM_COOKIES === 'false') return undefined;

  const cookieCandidates = [
    process.env.MEDIAHUB_YOUTUBE_COOKIES,
    process.env.YOUTUBE_COOKIES_PATH,
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

async function getEnhancedEnv(): Promise<{ env: NodeJS.ProcessEnv; ffmpegLocation?: string }> {
  const ffmpegRes = await ExecutableResolver.resolveFfmpeg();
  const env: NodeJS.ProcessEnv = { ...process.env };
  let ffmpegLocation: string | undefined = undefined;

  if (ffmpegRes.available && ffmpegRes.command) {
    ffmpegLocation = ffmpegRes.command;
    const ffmpegDir = path.dirname(ffmpegRes.command);
    const pathKey = Object.keys(env).find((k) => k.toLowerCase() === 'path') || 'PATH';
    const currentPath = env[pathKey] || '';
    if (!currentPath.includes(ffmpegDir)) {
      env[pathKey] = `${ffmpegDir}${path.delimiter}${currentPath}`;
    }
  }

  return { env, ffmpegLocation };
}

function classifyError(url: string, rawError: string): DownloaderError {
  const err = (rawError || '').toLowerCase();
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('music.youtube.com');
  const isInstagram = url.includes('instagram.com') || url.includes('instagr.am');
  const isReddit = url.includes('reddit.com') || url.includes('redd.it');

  if (isYouTube && (err.includes('too many requests') || err.includes('429') || err.includes('confirm you’re not a robot') || err.includes('sign in to confirm'))) {
    return new DownloaderError(
      'YOUTUBE_RATE_LIMIT',
      'YouTube is temporarily limiting requests. MediaHub will automatically retry. If the issue persists, connect a browser session using cookies for authenticated extraction.',
      60,
      rawError
    );
  }

  if (isInstagram && (err.includes('too many requests') || err.includes('429') || err.includes('rate limit'))) {
    return new DownloaderError(
      'INSTAGRAM_RATE_LIMIT',
      'Instagram is temporarily limiting anonymous requests. Please wait one minute and try again or configure authentication cookies.',
      60,
      rawError
    );
  }

  if (isInstagram && (err.includes('empty media response') || err.includes('login') || err.includes('redirecting to login'))) {
    return new DownloaderError(
      'LOGIN_REQUIRED',
      'This Instagram post or reel requires login to view. Please try another link or configure cookies in settings.',
      undefined,
      rawError
    );
  }

  if (isReddit && (err.includes('403') || err.includes('forbidden'))) {
    return new DownloaderError(
      'RATE_LIMIT_EXCEEDED',
      'Reddit denied anonymous access. Content may require authentication or updated headers.',
      60,
      rawError
    );
  }

  if (err.includes('private video') || err.includes('private media') || err.includes('login required')) {
    return new DownloaderError('PRIVATE_POST', 'This media is private or restricted.', undefined, rawError);
  }

  if (err.includes('404') || err.includes('not found') || err.includes('video unavailable') || err.includes('post not found')) {
    return new DownloaderError('POST_NOT_FOUND', 'Media not found at this URL. Content may have been removed or deleted.', undefined, rawError);
  }

  if (err.includes('unsupported url') || err.includes('no suitable extractor')) {
    return new DownloaderError('INVALID_URL', `This URL is not currently supported: ${url}`, undefined, rawError);
  }

  if (err.includes('etimedout') || err.includes('econnrefused') || err.includes('unable to download webpage')) {
    return new DownloaderError('NETWORK_ERROR', 'Unable to reach the media provider. Please check network status.', undefined, rawError);
  }

  const firstErrorLine = rawError
    ? rawError
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.startsWith('ERROR:') || l.includes('Error')) || rawError.slice(0, 200)
    : 'yt-dlp extraction error';

  return new DownloaderError('YT_DLP_FAILED', `Metadata extraction failed: ${firstErrorLine}`, undefined, rawError);
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
    const { env, ffmpegLocation } = await getEnhancedEnv();

    const timeoutMs = parseInt(process.env.YTDLP_TIMEOUT || '30000', 10);
    const maxRetries = 3;
    const backoffDelays = [0, 2000, 5000, 10000];

    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (attempt > 1) {
        const delay = backoffDelays[attempt - 1] || 5000;
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[YtDlp Backoff] Waiting ${delay}ms before attempt ${attempt}/${maxRetries} for ${url}`);
        }
        await new Promise((res) => setTimeout(res, delay));
      }

      const userAgent = getRandomUserAgent();
      const extraArgs: string[] = ['--user-agent', userAgent];

      if (platform === 'YOUTUBE' || platform === 'YOUTUBE_MUSIC') {
        extraArgs.push('--extractor-args', 'youtube:player_client=android,web');
      }

      if (cookiePath) {
        extraArgs.push('--cookies', cookiePath);
      } else {
        extraArgs.push('--referer', 'https://www.google.com/', '--add-header', 'Accept-Language: en-US,en;q=0.9');
      }

      if (ffmpegLocation) {
        extraArgs.push('--ffmpeg-location', ffmpegLocation);
      }

      const args = [...resolved.args, '--no-playlist', ...extraArgs, '--dump-json', '--no-warnings', url];
      const startTime = Date.now();

      try {
        const { stdout } = await execFileAsync(resolved.command, args, {
          maxBuffer: 30 * 1024 * 1024,
          timeout: timeoutMs,
          env,
        });

        const durationMs = Date.now() - startTime;

        console.log(`[MediaHub Analyze] Extraction Success (Attempt ${attempt}/${maxRetries})`);
        console.log(`  URL: ${url}`);
        console.log(`  Platform: ${platform}`);
        console.log(`  Executable: ${resolved.command}`);
        console.log(`  Execution Time: ${durationMs}ms`);

        return JSON.parse(stdout) as YtDlpDumpJsonOutput;
      } catch (err: any) {
        lastError = err;
        const durationMs = Date.now() - startTime;

        console.warn(`[MediaHub Analyze] Attempt ${attempt}/${maxRetries} Failed`);
        console.warn(`  URL: ${url}`);
        console.warn(`  Platform: ${platform}`);
        console.warn(`  Executable: ${resolved.command}`);
        console.warn(`  Command: ${resolved.command} ${args.join(' ')}`);
        console.warn(`  Stderr: ${err.stderr || err.message}`);
        console.warn(`  Execution Time: ${durationMs}ms`);

        if (err.code === 'ENOENT') {
          throw new DownloaderError(
            'YT_DLP_FAILED',
            `yt-dlp executable could not be executed at '${resolved.displayPath}'. Please verify installation or set YT_DLP_PATH.`,
            undefined,
            err.stderr || err.message
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
    const userAgent = getRandomUserAgent();
    const cookiePath = resolveCookiePath();
    const { env, ffmpegLocation } = await getEnhancedEnv();

    const extraArgs = ['--user-agent', userAgent];
    if (cookiePath) extraArgs.push('--cookies', cookiePath);
    if (ffmpegLocation) extraArgs.push('--ffmpeg-location', ffmpegLocation);

    try {
      const { stdout } = await execFileAsync(
        resolved.command,
        [...resolved.args, '--flat-playlist', ...extraArgs, '--dump-single-json', '--no-warnings', url],
        { maxBuffer: 30 * 1024 * 1024, env }
      );
      const json = JSON.parse(stdout) as YtDlpDumpJsonOutput;
      const entries = json.entries || [];

      const items = entries.map((entry, index) => ({
        id: entry.id,
        title: entry.title || `Track ${index + 1}`,
        rawUrl: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
        duration: entry.duration,
        position: index + 1,
      }));

      return {
        rawUrl: url,
        title: json.title || 'Album / Playlist',
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

  static categorizeFormats(
    rawFormats: YtDlpDumpJsonOutput['formats'] = [],
    overallDuration = 180,
    ffmpegAvailable = true,
    platform: PlatformType = 'UNKNOWN'
  ): CategorizedQualities {
    return NormalizerFactory.normalize(platform, rawFormats, overallDuration, ffmpegAvailable);
  }

  static async downloadMediaToFile(
    rawUrl: string,
    formatId: string,
    targetPath: string
  ): Promise<{ path: string; size: number }> {
    const resolved = await ExecutableResolver.resolveYtDlp();
    if (!resolved.available) {
      throw new DownloaderError('YT_DLP_FAILED', `yt-dlp executable could not be found on host system.`);
    }

    const url = normalizeMediaUrl(rawUrl);
    const platform = detectPlatform(url);
    const userAgent = getRandomUserAgent();
    const cookiePath = resolveCookiePath();
    const { env, ffmpegLocation } = await getEnhancedEnv();

    const extraArgs = ['--user-agent', userAgent, '--referer', 'https://www.google.com/'];
    if (platform === 'YOUTUBE' || platform === 'YOUTUBE_MUSIC') {
      extraArgs.push('--extractor-args', 'youtube:player_client=android,web');
    }
    if (cookiePath) extraArgs.push('--cookies', cookiePath);
    if (ffmpegLocation) extraArgs.push('--ffmpeg-location', ffmpegLocation);

    let targetFormat = formatId;
    const requiresMux = targetFormat.includes('+');

    const args = [...resolved.args, '--no-playlist', ...extraArgs, '-f', targetFormat];
    if (requiresMux) {
      args.push('--merge-output-format', 'mp4');
    }
    args.push('-o', targetPath, '--no-warnings', url);

    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const startTime = Date.now();
    console.log(`[MediaHub Download Pipeline] Starting Download Job`);
    console.log(`  URL: ${url}`);
    console.log(`  Platform: ${platform}`);
    console.log(`  Format ID: ${formatId} (Requires Mux: ${requiresMux})`);
    console.log(`  Destination: ${targetPath}`);
    console.log(`  Command: ${resolved.command} ${args.join(' ')}`);

    try {
      const { stderr } = await execFileAsync(resolved.command, args, { timeout: 180000, env });
      const durationMs = Date.now() - startTime;

      if (!fs.existsSync(targetPath)) {
        console.error(`[MediaHub Download Error] Target file was not created by yt-dlp. Stderr: ${stderr}`);
        throw new DownloaderError(
          'DOWNLOAD_FILE_NOT_CREATED',
          `yt-dlp completed execution but output file '${targetPath}' was not created. Stderr: ${stderr}`
        );
      }

      const stat = fs.statSync(targetPath);
      if (stat.size === 0) {
        console.error(`[MediaHub Download Error] Downloaded target file is 0 bytes.`);
        try { fs.unlinkSync(targetPath); } catch {}
        throw new DownloaderError(
          'DOWNLOADED_FILE_EMPTY',
          `Downloaded media file is 0 bytes. The selected format or video stream is unavailable.`
        );
      }

      console.log(`[MediaHub Download Success] File Verified & Saved!`);
      console.log(`  File Path: ${targetPath}`);
      console.log(`  File Size: ${stat.size} bytes (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`  Duration: ${durationMs}ms`);

      return { path: targetPath, size: stat.size };
    } catch (err: any) {
      if (fs.existsSync(targetPath)) {
        try { fs.unlinkSync(targetPath); } catch {}
      }
      if (err instanceof DownloaderError) throw err;
      throw classifyError(url, err.stderr || err.message);
    }
  }

  static async createStream(rawUrl: string, formatId: string): Promise<StreamResult> {
    const resolved = await ExecutableResolver.resolveYtDlp();
    if (!resolved.available) {
      throw new DownloaderError('YT_DLP_FAILED', `yt-dlp executable could not be found for streaming.`);
    }

    const url = normalizeMediaUrl(rawUrl);
    const platform = detectPlatform(url);
    const userAgent = getRandomUserAgent();
    const cookiePath = resolveCookiePath();
    const { env, ffmpegLocation } = await getEnhancedEnv();

    const extraArgs = ['--user-agent', userAgent, '--referer', 'https://www.google.com/'];
    if (platform === 'YOUTUBE' || platform === 'YOUTUBE_MUSIC') {
      extraArgs.push('--extractor-args', 'youtube:player_client=android,web');
    }
    if (cookiePath) extraArgs.push('--cookies', cookiePath);
    if (ffmpegLocation) extraArgs.push('--ffmpeg-location', ffmpegLocation);

    let targetFormat = formatId;
    const isMuxFormat = targetFormat.includes('+');

    const args = [...resolved.args, '--no-playlist', ...extraArgs, '-f', targetFormat];
    if (isMuxFormat) {
      args.push('--merge-output-format', 'mp4');
    }
    args.push('-o', '-', '--no-warnings', url);

    const child = spawn(resolved.command, args, { env });
    return {
      stream: child.stdout,
      process: child,
    };
  }

  static async createAudioExtractStream(rawUrl: string, audioFormat?: string): Promise<StreamResult> {
    const resolved = await ExecutableResolver.resolveYtDlp();
    if (!resolved.available) {
      throw new DownloaderError('YT_DLP_FAILED', `yt-dlp executable could not be found for audio extraction.`);
    }

    const url = normalizeMediaUrl(rawUrl);
    const platform = detectPlatform(url);
    const userAgent = getRandomUserAgent();
    const cookiePath = resolveCookiePath();
    const { env, ffmpegLocation } = await getEnhancedEnv();

    const extraArgs = ['--user-agent', userAgent, '--referer', 'https://www.google.com/'];
    if (platform === 'YOUTUBE' || platform === 'YOUTUBE_MUSIC') {
      extraArgs.push('--extractor-args', 'youtube:player_client=android,web');
    }
    if (cookiePath) extraArgs.push('--cookies', cookiePath);
    if (ffmpegLocation) extraArgs.push('--ffmpeg-location', ffmpegLocation);

    const args = [...resolved.args, '--no-playlist', ...extraArgs, '-f', 'bestaudio/best', '-o', '-', '--no-warnings', url];
    const child = spawn(resolved.command, args, { env });
    return {
      stream: child.stdout,
      process: child,
    };
  }

  static async downloadAudioToFile(rawUrl: string, targetPath: string): Promise<{ path: string; size: number }> {
    return this.downloadMediaToFile(rawUrl, 'bestaudio/best', targetPath);
  }
}
