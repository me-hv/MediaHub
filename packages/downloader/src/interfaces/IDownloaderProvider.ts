import { MediaMetadata } from '@mediahub/types';
import { StreamResult, DownloaderError } from '../yt-dlp/YtDlpWrapper';

export type ProviderResult =
  | { success: true; metadata: MediaMetadata }
  | { success: false; error: DownloaderError };

export interface IDownloaderProvider {
  readonly name: string;
  canHandle(url: string): boolean;
  extractMetadata(url: string, urlHash: string): Promise<MediaMetadata>;
  extractMetadataResult?(url: string, urlHash: string): Promise<ProviderResult>;
  getStream(url: string, formatId: string): Promise<StreamResult>;
}
