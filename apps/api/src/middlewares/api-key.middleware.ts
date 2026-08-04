import { Context, Next } from 'hono';
import { ApiKeyService } from '../services/api-key.service';
import { ApiScope } from '@mediahub/types';
import type { AppEnv } from '../app';

export function apiKeyMiddleware() {
  return async (c: Context<AppEnv>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    const xApiKey = c.req.header('X-API-Key');

    let rawKey: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      rawKey = authHeader.substring(7);
    } else if (xApiKey) {
      rawKey = xApiKey;
    }

    if (!rawKey) {
      return c.json(
        {
          success: false,
          code: 'UNAUTHORIZED_KEY',
          message: 'Missing API Key in Authorization header or X-API-Key header.',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId') || 'req-unknown',
        },
        401
      );
    }

    const apiKey = await ApiKeyService.validateApiKey(rawKey);

    if (!apiKey) {
      return c.json(
        {
          success: false,
          code: 'INVALID_KEY',
          message: 'Invalid, revoked, or expired API key.',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId') || 'req-unknown',
        },
        401
      );
    }

    (c as any).set('apiKey', apiKey);
    c.set('user', {
      id: apiKey.userId || 'guest-user',
      email: apiKey.user?.email || 'guest@mediahub.io',
    });

    await next();
  };
}

export function scopeMiddleware(requiredScope: ApiScope) {
  return async (c: Context<AppEnv>, next: Next) => {
    const apiKey = (c as any).get('apiKey');

    if (!apiKey || !apiKey.scopes) {
      return c.json(
        {
          success: false,
          code: 'FORBIDDEN_SCOPE',
          message: 'API Key scopes missing or invalid.',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId') || 'req-unknown',
        },
        403
      );
    }

    const hasScope = apiKey.scopes.includes(requiredScope) || apiKey.scopes.includes('admin');

    if (!hasScope) {
      return c.json(
        {
          success: false,
          code: 'INSUFFICIENT_SCOPE',
          message: `API Key lacks required scope: '${requiredScope}'.`,
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId') || 'req-unknown',
        },
        403
      );
    }

    await next();
  };
}

export function idempotencyMiddleware() {
  return async (c: Context<AppEnv>, next: Next) => {
    const idempotencyKey = c.req.header('Idempotency-Key');

    if (idempotencyKey) {
      c.header('X-Idempotency-Key', idempotencyKey);
    }

    await next();
  };
}
