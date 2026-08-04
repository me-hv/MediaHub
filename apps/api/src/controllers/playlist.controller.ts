import { Context } from 'hono';
import { PlaylistService } from '../services/playlist.service';
import { sanitizeAndValidateUrl } from '@mediahub/utils';
import type { AppEnv } from '../app';

export class PlaylistController {
  static async analyzePlaylist(c: Context<AppEnv>) {
    const user = c.get('user');
    const requestId = c.get('requestId') || 'req-unknown';

    const body = await c.req.json();
    const validation = sanitizeAndValidateUrl(body?.url);
    if (!validation.success) {
      return c.json({ success: false, code: 'INVALID_URL', message: validation.error, timestamp: new Date().toISOString(), requestId }, 400);
    }

    try {
      const playlist = await PlaylistService.analyzePlaylist(validation.url, user?.id);
      return c.json({ success: true, data: { playlist }, timestamp: new Date().toISOString(), requestId });
    } catch (err: any) {
      return c.json({ success: false, code: 'PLAYLIST_ERROR', message: err.message || 'Could not parse playlist', timestamp: new Date().toISOString(), requestId }, 500);
    }
  }
}
