import { Readable } from 'stream';

export interface StorageObjectInfo {
  key: string;
  size: number;
  contentType?: string;
  lastModified?: Date;
}

export interface IStorageProvider {
  /**
   * Save a readable stream to persistent storage
   */
  saveStream(key: string, stream: Readable, contentType?: string): Promise<string>;

  /**
   * Retrieve a file stream from storage
   */
  getStream(key: string): Promise<Readable>;

  /**
   * Check if a file key exists in storage
   */
  exists(key: string): Promise<boolean>;

  /**
   * Delete a stored file
   */
  delete(key: string): Promise<boolean>;

  /**
   * Retrieve metadata info for stored file
   */
  getInfo(key: string): Promise<StorageObjectInfo | null>;

  /**
   * Generate a signed CDN / storage download URL
   */
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
