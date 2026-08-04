import { GenericYtDlpProvider } from './GenericYtDlpProvider';
import { detectPlatform } from '@mediahub/utils';

export class InstagramProvider extends GenericYtDlpProvider {
  override readonly name: string = 'InstagramProvider';

  override canHandle(url: string): boolean {
    return detectPlatform(url) === 'INSTAGRAM';
  }
}
