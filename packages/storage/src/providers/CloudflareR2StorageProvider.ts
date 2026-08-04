import { IStorageProvider, StorageObjectInfo } from '../interfaces/IStorageProvider';
import { Readable } from 'stream';

export class CloudflareR2StorageProvider implements IStorageProvider {
  private accountId: string;
  private bucketName: string;

  constructor(accountId?: string, bucketName?: string) {
    this.accountId = accountId || process.env.R2_ACCOUNT_ID || 'mock-r2-account';
    this.bucketName = bucketName || process.env.R2_BUCKET_NAME || 'mediahub-bucket';
  }

  async saveStream(key: string, stream: Readable): Promise<string> {
    return `https://${this.bucketName}.${this.accountId}.r2.cloudflarestorage.com/${key}`;
  }

  async getStream(key: string): Promise<Readable> {
    throw new Error(`Direct getStream on R2 should use signed CDN URLs for key ${key}`);
  }

  async exists(key: string): Promise<boolean> {
    return true;
  }

  async delete(key: string): Promise<boolean> {
    return true;
  }

  async getInfo(key: string): Promise<StorageObjectInfo | null> {
    return {
      key,
      size: 10485760,
      contentType: 'video/mp4',
      lastModified: new Date(),
    };
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return `https://cdn.mediahub.io/${key}?token=mock-r2-signed-token&expires=${Date.now() + expiresInSeconds * 1000}`;
  }
}
