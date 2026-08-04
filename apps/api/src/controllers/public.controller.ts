import { Context } from 'hono';
import { ApiKeyService } from '../services/api-key.service';
import { WebhookService } from '../services/webhook.service';
import { ApiIntrospectionData } from '@mediahub/types';
import type { AppEnv } from '../app';

export class PublicController {
  static async getMe(c: Context<AppEnv>) {
    const apiKey = (c as any).get('apiKey');
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';

    const introspection: ApiIntrospectionData = {
      keyId: apiKey?.id || 'key-guest',
      keyPrefix: apiKey?.keyPrefix || 'mh_live_guest',
      scopes: apiKey?.scopes || ['media.read', 'media.download'],
      user: {
        id: user.id,
        email: user.email,
      },
      rateLimit: {
        limit: 1000,
        remaining: 984,
        resetSeconds: 3600,
      },
      quota: {
        monthlyDownloadsLimit: 10000,
        downloadsUsed: 142,
      },
    };

    return c.json({ success: true, data: introspection, timestamp: new Date().toISOString(), requestId });
  }

  static async createApiKey(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const body = await c.req.json();

    const name = body?.name || 'Default API Key';
    const scopes = body?.scopes;

    const apiKey = await ApiKeyService.createApiKey(user.id, name, scopes);
    return c.json({ success: true, data: { apiKey }, timestamp: new Date().toISOString(), requestId });
  }

  static async listApiKeys(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const keys = await ApiKeyService.listApiKeys(user.id);
    return c.json({ success: true, data: { keys }, timestamp: new Date().toISOString(), requestId });
  }

  static async revokeApiKey(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const id = c.req.param('id') || '';

    const revoked = await ApiKeyService.revokeApiKey(id, user.id);
    return c.json({ success: revoked, message: revoked ? 'API Key revoked' : 'Key not found', timestamp: new Date().toISOString(), requestId });
  }

  static async createWebhook(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const body = await c.req.json();

    const url = body?.url;
    const events = body?.events || ['download.completed'];

    if (!url || !url.startsWith('http')) {
      return c.json({ success: false, code: 'INVALID_URL', message: 'Please provide a valid HTTP/HTTPS webhook URL.', timestamp: new Date().toISOString(), requestId }, 400);
    }

    const webhook = await WebhookService.createWebhook(user.id, url, events);
    return c.json({ success: true, data: { webhook }, timestamp: new Date().toISOString(), requestId });
  }

  static async listWebhooks(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const webhooks = await WebhookService.listWebhooks(user.id);
    return c.json({ success: true, data: { webhooks }, timestamp: new Date().toISOString(), requestId });
  }

  static async deleteWebhook(c: Context<AppEnv>) {
    const user = c.get('user')!;
    const requestId = c.get('requestId') || 'req-unknown';
    const id = c.req.param('id') || '';

    const deleted = await WebhookService.deleteWebhook(id, user.id);
    return c.json({ success: deleted, message: deleted ? 'Webhook removed' : 'Webhook not found', timestamp: new Date().toISOString(), requestId });
  }
}
