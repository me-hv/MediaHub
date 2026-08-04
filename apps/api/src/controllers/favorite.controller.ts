import { Context } from 'hono';
import { FavoriteService } from '../services/favorite.service';
import { sanitizeAndValidateUrl, detectPlatform } from '@mediahub/utils';
import type { AppEnv } from '../app';

export class FavoriteController {
  static async addFavorite(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const body = await c.req.json();

    const validation = sanitizeAndValidateUrl(body?.rawUrl || body?.url);
    if (!validation.success) {
      return c.json({ success: false, code: 'INVALID_URL', message: validation.error, timestamp: new Date().toISOString(), requestId }, 400);
    }

    const platform = detectPlatform(validation.url);
    const favorite = await FavoriteService.addFavorite(user.id, {
      rawUrl: validation.url,
      providerVideoId: body.providerVideoId,
      urlHash: validation.hash,
      title: body.title || 'Bookmarked Media',
      thumbnail: body.thumbnail,
      platform,
      duration: body.duration,
    });

    return c.json({ success: true, data: { favorite }, timestamp: new Date().toISOString(), requestId });
  }

  static async getFavorites(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const favorites = await FavoriteService.getFavorites(user.id);
    return c.json({ success: true, data: { favorites }, timestamp: new Date().toISOString(), requestId });
  }

  static async removeFavorite(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const id = c.req.param('id') || '';
    const removed = await FavoriteService.removeFavorite(id, user.id);
    return c.json({ success: removed, message: removed ? 'Favorite removed' : 'Item not found', timestamp: new Date().toISOString(), requestId });
  }
}
