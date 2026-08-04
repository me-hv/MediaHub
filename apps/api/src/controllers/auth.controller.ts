import { Context } from 'hono';
import { UserService } from '../services/user.service';
import type { AppEnv } from '../app';

export class AuthController {
  static async syncUser(c: Context<AppEnv>) {
    const user = c.get('user');
    const requestId = c.get('requestId') || 'req-unknown';

    if (!user) {
      return c.json({ success: false, code: 'UNAUTHORIZED', message: 'Token missing', timestamp: new Date().toISOString(), requestId }, 401);
    }

    let body: any = {};
    try {
      body = await c.req.json();
    } catch {}

    const synced = await UserService.syncUser(
      user.id,
      body.email || user.email,
      body.displayName || user.displayName,
      body.photoURL
    );

    return c.json({
      success: true,
      data: { user: synced },
      timestamp: new Date().toISOString(),
      requestId,
    });
  }
}
