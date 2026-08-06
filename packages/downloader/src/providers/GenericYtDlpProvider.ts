import { IDownloaderProvider, ProviderResult } from '../interfaces/IDownloaderProvider';
import { MediaMetadata } from '@mediahub/types';
import { detectPlatform, normalizeMediaUrl } from '@mediahub/utils';
import { YtDlpWrapper, StreamResult, DownloaderError } from '../yt-dlp/YtDlpWrapper';

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

export class GenericYtDlpProvider implements IDownloaderProvider {
  readonly name: string = 'GenericYtDlpProvider';

  canHandle(_url: string): boolean {
    return true; // Fallback provider handles any URL
  }

  async extractMetadata(rawUrl: string, urlHash: string): Promise<MediaMetadata> {
    const url = normalizeMediaUrl(rawUrl);
    const platform = detectPlatform(url);
    const json = await YtDlpWrapper.dumpJson(url);
    const qualities = YtDlpWrapper.categorizeFormats(json.formats, json.duration, true, platform);

    const width = json.width;
    const height = json.height;
    const aspectRatio = calculateAspectRatio(width, height);

    return {
      url,
      urlHash,
      title: json.title || 'Untitled Media',
      uploader: json.uploader || json.uploader_id || 'Unknown Uploader',
      channel: json.channel,
      duration: json.duration,
      thumbnail: json.thumbnail,
      viewCount: json.view_count,
      likeCount: json.like_count,
      commentCount: json.comment_count,
      uploadDate: json.upload_date,
      description: json.description ? json.description.slice(0, 300) : undefined,
      width,
      height,
      aspectRatio,
      platform,
      qualities,
    };
  }

  async extractMetadataResult(url: string, urlHash: string): Promise<ProviderResult> {
    try {
      const metadata = await this.extractMetadata(url, urlHash);
      return { success: true, metadata };
    } catch (err: any) {
      if (err instanceof DownloaderError) {
        return { success: false, error: err };
      }
      return {
        success: false,
        error: new DownloaderError('YT_DLP_FAILED', err.message || 'Failed to extract metadata'),
      };
    }
  }

  async getStream(url: string, formatId: string): Promise<StreamResult> {
    return YtDlpWrapper.createStream(url, formatId);
  }
}
