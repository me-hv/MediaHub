import { Context } from 'hono';
import { HistoryService } from '../services/history.service';
import type { AppEnv } from '../app';

export class HistoryController {
  static async getHistory(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const search = c.req.query('search');
    const platform = c.req.query('platform');
    const page = c.req.query('page') ? parseInt(c.req.query('page')!) : 1;

    const result = await HistoryService.getHistory(user.id, { search, platform, page });
    return c.json({ success: true, data: result, timestamp: new Date().toISOString(), requestId });
  }

  static async deleteHistoryItem(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const id = c.req.param('id') || '';
    const deleted = await HistoryService.deleteHistoryItem(id, user.id);
    return c.json({ success: deleted, message: deleted ? 'Item deleted' : 'Item not found', timestamp: new Date().toISOString(), requestId });
  }

  static async clearHistory(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    await HistoryService.clearUserHistory(user.id);
    return c.json({ success: true, message: 'History cleared', timestamp: new Date().toISOString(), requestId });
  }
}
