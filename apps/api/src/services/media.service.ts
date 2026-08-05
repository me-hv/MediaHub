import { ProviderFactory } from '@mediahub/downloader';
import { MediaMetadata, PlatformType } from '@mediahub/types';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

// In-memory cache fallback if Prisma database connection is not available
const inMemoryCache = new Map<string, { metadata: MediaMetadata; expiresAt: number }>();

export class MediaService {
  static clearCache() {
    inMemoryCache.clear();
    logger.info('In-memory media metadata cache cleared.');
  }

  static async analyzeMedia(url: string, urlHash: string): Promise<MediaMetadata> {
    const now = new Date();

    // 1. Check Prisma Cache (if database available)
    try {
      const cached = await prisma.mediaCache.findUnique({
        where: { urlHash },
      });

      if (cached && cached.expiresAt > now) {
        const cachedMeta = cached.metadata as unknown as MediaMetadata;
        // Ensure no stale demo metadata is returned
        if (!cachedMeta.title.includes('MediaHub Demo Video')) {
          logger.info({ urlHash, title: cachedMeta.title }, 'Serving media metadata from PostgreSQL cache');
          return cachedMeta;
        }
      }
    } catch (err: any) {
      logger.warn({ error: err.message }, 'Postgres query failed, falling back to live extraction');
    }

    // 2. Check Memory Cache fallback
    const memCached = inMemoryCache.get(urlHash);
    if (memCached && memCached.expiresAt > Date.now()) {
      if (!memCached.metadata.title.includes('MediaHub Demo Video')) {
        logger.info({ urlHash, title: memCached.metadata.title }, 'Serving media metadata from in-memory fallback cache');
        return memCached.metadata;
      }
      inMemoryCache.delete(urlHash); // Purge stale demo entry
    }

    // 3. Extract Real Live Metadata via Provider Engine (yt-dlp)
    logger.info({ url, urlHash }, 'Extracting real live metadata from provider engine');
    const provider = ProviderFactory.getProvider(url);
    const metadata = await provider.extractMetadata(url, urlHash);
    metadata.cachedAt = new Date().toISOString();

    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours TTL

    // 4. Save to Postgres Cache
    try {
      await prisma.mediaCache.upsert({
        where: { urlHash },
        update: {
          rawUrl: url,
          platform: metadata.platform,
          title: metadata.title,
          uploader: metadata.uploader,
          duration: metadata.duration,
          thumbnail: metadata.thumbnail,
          metadata: metadata as any,
          expiresAt,
        },
        create: {
          urlHash,
          rawUrl: url,
          platform: metadata.platform,
          title: metadata.title,
          uploader: metadata.uploader,
          duration: metadata.duration,
          thumbnail: metadata.thumbnail,
          metadata: metadata as any,
          expiresAt,
        },
      });
    } catch (err: any) {
      logger.warn({ error: err.message }, 'Failed to persist metadata to Postgres; saving in memory');
    }

    // Always update memory fallback
    inMemoryCache.set(urlHash, { metadata, expiresAt: expiresAt.getTime() });

    return metadata;
  }

  static async recordDownload(urlHash: string, platform: PlatformType, formatId: string, status: string, ipAddress?: string) {
    try {
      await prisma.downloadHistory.create({
        data: {
          urlHash,
          rawUrl: urlHash,
          title: `Download (${formatId})`,
          platform,
          formatId,
          mediaType: 'COMBINED',
          status,
          ipAddress,
        },
      });
    } catch (err: any) {
      logger.warn({ error: err.message }, 'Could not save download log to Postgres');
    }
  }
}
