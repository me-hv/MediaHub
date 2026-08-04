import { IStorageProvider, StorageObjectInfo } from '../interfaces/IStorageProvider';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(process.cwd(), 'storage');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    const sanitizedKey = path.basename(key);
    return path.join(this.baseDir, sanitizedKey);
  }

  async saveStream(key: string, stream: Readable): Promise<string> {
    const filePath = this.getFilePath(key);
    const writeStream = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      stream.pipe(writeStream);
      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', reject);
      stream.on('error', reject);
    });
  }

  async getStream(key: string): Promise<Readable> {
    const filePath = this.getFilePath(key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found in local storage: ${key}`);
    }
    return fs.createReadStream(filePath);
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    return fs.existsSync(filePath);
  }

  async delete(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  async getInfo(key: string): Promise<StorageObjectInfo | null> {
    const filePath = this.getFilePath(key);
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    return {
      key,
      size: stat.size,
      lastModified: stat.mtime,
    };
  }

  async getSignedUrl(key: string): Promise<string> {
    return `/api/v1/storage/local/${encodeURIComponent(key)}`;
  }
}
