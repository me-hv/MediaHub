import { IDownloaderProvider } from '../interfaces/IDownloaderProvider';
import { YoutubeProvider } from '../providers/YoutubeProvider';
import { YouTubeMusicProvider } from '../providers/YouTubeMusicProvider';
import { InstagramProvider } from '../providers/InstagramProvider';
import { RedditProvider } from '../providers/RedditProvider';
import { GenericYtDlpProvider } from '../providers/GenericYtDlpProvider';

export class ProviderFactory {
  private static providers: IDownloaderProvider[] = [
    new YouTubeMusicProvider(),
    new YoutubeProvider(),
    new InstagramProvider(),
    new RedditProvider(),
  ];

  private static fallbackProvider: IDownloaderProvider = new GenericYtDlpProvider();

  static getProvider(url: string): IDownloaderProvider {
    for (const provider of this.providers) {
      if (provider.canHandle(url)) {
        return provider;
      }
    }
    return this.fallbackProvider;
  }
}
