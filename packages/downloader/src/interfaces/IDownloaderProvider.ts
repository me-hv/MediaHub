import { MediaMetadata } from '@mediahub/types';
import { StreamResult } from '../yt-dlp/YtDlpWrapper';

export interface IDownloaderProvider {
  readonly name: string;
  canHandle(url: string): boolean;
  extractMetadata(url: string, urlHash: string): Promise<MediaMetadata>;
  getStream(url: string, formatId: string): Promise<StreamResult>;
}
