import { IStorageProvider, StorageObjectInfo } from '../interfaces/IStorageProvider';
import { Readable } from 'stream';

export class S3StorageProvider implements IStorageProvider {
  private bucketName: string;
  private region: string;

  constructor(bucketName?: string, region?: string) {
    this.bucketName = bucketName || process.env.S3_BUCKET_NAME || 'mediahub-s3-bucket';
    this.region = region || process.env.S3_REGION || 'us-east-1';
  }

  async saveStream(key: string, stream: Readable): Promise<string> {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async getStream(key: string): Promise<Readable> {
    throw new Error(`Direct getStream on AWS S3 should use signed URLs for key ${key}`);
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
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}?X-Amz-Signature=mock-s3-signature&X-Amz-Expires=${expiresInSeconds}`;
  }
}
