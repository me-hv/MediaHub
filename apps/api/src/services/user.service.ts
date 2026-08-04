import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

// Memory fallback for user settings when database connection is offline
const inMemoryUserSettings = new Map<string, any>();

export class UserService {
  static async syncUser(id: string, email: string, displayName?: string, photoURL?: string) {
    try {
      const user = await prisma.user.upsert({
        where: { id },
        update: {
          email,
          displayName: displayName || undefined,
          photoURL: photoURL || undefined,
        },
        create: {
          id,
          email,
          displayName,
          photoURL,
          settings: {
            create: {
              defaultFormat: 'mp4',
              defaultQuality: 'best',
              filenameTemplate: '{title}',
              autoAnalyze: true,
              maxConcurrentDownloads: 3,
              theme: 'DARK',
            },
          },
        },
        include: { settings: true },
      });
      return user;
    } catch (err: any) {
      logger.warn({ error: err.message, userId: id }, 'Postgres sync failed; returning fallback profile');
      return { id, email, displayName, photoURL, settings: null };
    }
  }

  static async getSettings(userId: string) {
    try {
      let settings = await prisma.userSettings.findUnique({
        where: { userId },
      });
      if (!settings) {
        settings = await prisma.userSettings.create({
          data: {
            userId,
            defaultFormat: 'mp4',
            defaultQuality: 'best',
            filenameTemplate: '{title}',
            autoAnalyze: true,
            maxConcurrentDownloads: 3,
            theme: 'DARK',
          },
        });
      }
      return settings;
    } catch (err: any) {
      logger.warn({ error: err.message, userId }, 'Postgres fetch failed; using memory fallback for settings');
      return inMemoryUserSettings.get(userId) || {
        userId,
        defaultFormat: 'mp4',
        defaultQuality: 'best',
        filenameTemplate: '{title}',
        autoAnalyze: true,
        maxConcurrentDownloads: 3,
        theme: 'DARK',
      };
    }
  }

  static async updateSettings(userId: string, data: any) {
    try {
      const updated = await prisma.userSettings.upsert({
        where: { userId },
        update: {
          defaultFormat: data.defaultFormat,
          defaultQuality: data.defaultQuality,
          filenameTemplate: data.filenameTemplate,
          autoAnalyze: data.autoAnalyze,
          maxConcurrentDownloads: data.maxConcurrentDownloads,
          theme: data.theme || 'DARK',
        },
        create: {
          userId,
          defaultFormat: data.defaultFormat || 'mp4',
          defaultQuality: data.defaultQuality || 'best',
          filenameTemplate: data.filenameTemplate || '{title}',
          autoAnalyze: data.autoAnalyze !== undefined ? data.autoAnalyze : true,
          maxConcurrentDownloads: data.maxConcurrentDownloads || 3,
          theme: data.theme || 'DARK',
        },
      });
      return updated;
    } catch (err: any) {
      logger.warn({ error: err.message, userId }, 'Could not update Postgres settings; saving in memory');
      const fallback = { userId, ...data };
      inMemoryUserSettings.set(userId, fallback);
      return fallback;
    }
  }
}
