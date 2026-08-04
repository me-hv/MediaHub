import { GenericYtDlpProvider } from './GenericYtDlpProvider';
import { detectPlatform } from '@mediahub/utils';

export class YoutubeProvider extends GenericYtDlpProvider {
  override readonly name: string = 'YoutubeProvider';

  override canHandle(url: string): boolean {
    return detectPlatform(url) === 'YOUTUBE';
  }
}
