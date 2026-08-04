import { IDownloaderProvider } from '../interfaces/IDownloaderProvider';
import { MediaMetadata } from '@mediahub/types';
import { detectPlatform } from '@mediahub/utils';
import { YtDlpWrapper, StreamResult } from '../yt-dlp/YtDlpWrapper';

export class GenericYtDlpProvider implements IDownloaderProvider {
  readonly name: string = 'GenericYtDlpProvider';

  canHandle(_url: string): boolean {
    return true; // Fallback provider handles any URL
  }

  async extractMetadata(url: string, urlHash: string): Promise<MediaMetadata> {
    const json = await YtDlpWrapper.dumpJson(url);
    const qualities = YtDlpWrapper.categorizeFormats(json.formats);
    const platform = detectPlatform(url);

    return {
      url,
      urlHash,
      title: json.title || 'Untitled Media',
      uploader: json.uploader || json.uploader_id || 'Unknown Uploader',
      duration: json.duration,
      thumbnail: json.thumbnail,
      viewCount: json.view_count,
      uploadDate: json.upload_date,
      description: json.description ? json.description.slice(0, 300) : undefined,
      platform,
      qualities,
    };
  }

  async getStream(url: string, formatId: string): Promise<StreamResult> {
    return YtDlpWrapper.createStream(url, formatId);
  }
}
