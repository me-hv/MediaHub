import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { PlatformType } from '@mediahub/types';

const inMemoryFavorites: any[] = [];

export class FavoriteService {
  static async addFavorite(userId: string, data: { rawUrl: string; providerVideoId?: string; urlHash: string; title: string; thumbnail?: string; platform: PlatformType; duration?: number }) {
    try {
      const favorite = await prisma.favorite.upsert({
        where: { userId_rawUrl: { userId, rawUrl: data.rawUrl } },
        update: {
          title: data.title,
          thumbnail: data.thumbnail,
          providerVideoId: data.providerVideoId,
        },
        create: {
          userId,
          rawUrl: data.rawUrl,
          providerVideoId: data.providerVideoId,
          urlHash: data.urlHash,
          title: data.title,
          thumbnail: data.thumbnail,
          platform: data.platform || 'UNKNOWN',
          duration: data.duration,
        },
      });
      return favorite;
    } catch (err: any) {
      logger.warn({ error: err.message, userId }, 'Postgres favorite save failed; keeping in memory');
      const fallback = { id: `fav-${Date.now()}`, userId, ...data, createdAt: new Date() };
      inMemoryFavorites.push(fallback);
      return fallback;
    }
  }

  static async getFavorites(userId: string) {
    try {
      const items = await prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      return items;
    } catch {
      return inMemoryFavorites.filter((f) => f.userId === userId);
    }
  }

  static async removeFavorite(id: string, userId: string) {
    try {
      await prisma.favorite.deleteMany({
        where: { id, userId },
      });
      return true;
    } catch {
      return false;
    }
  }
}
