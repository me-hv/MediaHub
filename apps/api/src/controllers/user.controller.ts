import { Context } from 'hono';
import { UserService } from '../services/user.service';
import { HistoryService } from '../services/history.service';
import type { AppEnv } from '../app';

export class UserController {
  static async getSettings(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const settings = await UserService.getSettings(user.id);
    return c.json({ success: true, data: { settings }, timestamp: new Date().toISOString(), requestId });
  }

  static async updateSettings(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const body = await c.req.json();
    const updated = await UserService.updateSettings(user.id, body);
    return c.json({ success: true, data: { settings: updated }, timestamp: new Date().toISOString(), requestId });
  }

  static async getDashboardStats(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const stats = await HistoryService.getDashboardStats(user.id);
    return c.json({ success: true, data: { stats }, timestamp: new Date().toISOString(), requestId });
  }
}
