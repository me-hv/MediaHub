import { YtDlpWrapper } from '@mediahub/downloader';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { PlaylistMetadata } from '@mediahub/types';

export class PlaylistService {
  static async analyzePlaylist(playlistUrl: string, userId?: string): Promise<PlaylistMetadata> {
    logger.info({ playlistUrl, userId }, 'Parsing YouTube playlist metadata');
    const metadata = await YtDlpWrapper.parsePlaylist(playlistUrl);

    // Save to database if user is authenticated and Postgres is connected
    if (userId) {
      try {
        await prisma.playlist.create({
          data: {
            userId,
            rawUrl: playlistUrl,
            title: metadata.title,
            videoCount: metadata.videoCount,
            estimatedSize: metadata.estimatedSize ? BigInt(metadata.estimatedSize) : null,
            items: {
              create: metadata.items.map((item) => ({
                title: item.title,
                rawUrl: item.rawUrl,
                thumbnail: item.thumbnail,
                duration: item.duration,
                position: item.position,
              })),
            },
          },
        });
      } catch (err: any) {
        logger.warn({ error: err.message }, 'Failed to persist playlist to Postgres');
      }
    }

    return metadata;
  }
}
