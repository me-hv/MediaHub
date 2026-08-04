import { GenericYtDlpProvider } from './GenericYtDlpProvider';
import { detectPlatform } from '@mediahub/utils';

export class RedditProvider extends GenericYtDlpProvider {
  override readonly name: string = 'RedditProvider';

  override canHandle(url: string): boolean {
    return detectPlatform(url) === 'REDDIT';
  }
}
