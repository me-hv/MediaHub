import { MediaMetadata } from '@mediahub/types';
import { detectPlatform, normalizeMediaUrl } from '@mediahub/utils';
import { IDownloaderProvider, ProviderResult } from '../interfaces/IDownloaderProvider';
import { YtDlpWrapper, DownloaderError, StreamResult } from '../yt-dlp/YtDlpWrapper';

export class YouTubeMusicProvider implements IDownloaderProvider {
  readonly name = 'YouTubeMusicProvider';
  readonly platform = 'YOUTUBE_MUSIC';

  canHandle(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    const clean = url.toLowerCase();
    return clean.includes('music.youtube.com');
  }

  async extractMetadata(rawUrl: string, hash: string): Promise<MediaMetadata> {
    const url = normalizeMediaUrl(rawUrl);
    const json = await YtDlpWrapper.dumpJson(url);
    const qualities = YtDlpWrapper.categorizeFormats(json.formats || [], json.duration);

    const aspect = json.width && json.height && json.height > 0 ? `${(json.width / json.height).toFixed(2)}:1` : undefined;

    return {
      url,
      urlHash: hash,
      title: json.title || 'YouTube Music Track',
      uploader: json.uploader || json.channel || json.uploader_id || 'YouTube Music',
      channel: json.channel || json.uploader || 'YouTube Music',
      duration: json.duration,
      thumbnail: json.thumbnail,
      viewCount: json.view_count,
      likeCount: json.like_count,
      commentCount: json.comment_count,
      uploadDate: json.upload_date,
      description: json.description,
      width: json.width,
      height: json.height,
      aspectRatio: aspect,
      platform: 'YOUTUBE_MUSIC',
      qualities,
      cachedAt: new Date().toISOString(),
    };
  }

  async extractMetadataResult(rawUrl: string, hash: string): Promise<ProviderResult> {
    try {
      const metadata = await this.extractMetadata(rawUrl, hash);
      return { success: true, metadata };
    } catch (err: any) {
      if (err instanceof DownloaderError) {
        return { success: false, error: err };
      }
      return {
        success: false,
        error: new DownloaderError('YT_DLP_FAILED', err.message || 'YouTube Music metadata extraction failed'),
      };
    }
  }

  async getStream(url: string, formatId: string): Promise<StreamResult> {
    return YtDlpWrapper.createStream(url, formatId);
  }
}
