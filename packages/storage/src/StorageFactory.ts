import { IStorageProvider } from './interfaces/IStorageProvider';
import { LocalStorageProvider } from './providers/LocalStorageProvider';
import { CloudflareR2StorageProvider } from './providers/CloudflareR2StorageProvider';
import { S3StorageProvider } from './providers/S3StorageProvider';

export class StorageFactory {
  private static instance: IStorageProvider | null = null;

  static getProvider(type?: 'local' | 'r2' | 's3'): IStorageProvider {
    if (this.instance) return this.instance;

    const providerType = type || (process.env.STORAGE_PROVIDER as 'local' | 'r2' | 's3') || 'local';

    switch (providerType) {
      case 'r2':
        this.instance = new CloudflareR2StorageProvider();
        break;
      case 's3':
        this.instance = new S3StorageProvider();
        break;
      case 'local':
      default:
        this.instance = new LocalStorageProvider();
        break;
    }

    return this.instance;
  }
}
