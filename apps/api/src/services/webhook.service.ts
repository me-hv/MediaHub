import { prisma } from '../config/prisma';
import { CryptoUtils } from '@mediahub/utils';
import { WebhookEventType, WebhookConfigData } from '@mediahub/types';
import { logger } from '../utils/logger';

export class WebhookService {
  static async createWebhook(userId: string, url: string, events: WebhookEventType[]): Promise<WebhookConfigData> {
    const { secretKey, secretPrefix, secretHash } = CryptoUtils.generateWebhookSecret();

    const config = await prisma.webhookConfig.create({
      data: {
        userId,
        url,
        secretPrefix,
        secretHash,
        events: events.length > 0 ? events : ['download.completed'],
        status: 'ACTIVE',
      },
    });

    logger.info({ userId, webhookId: config.id }, 'Webhook endpoint configured');

    return {
      id: config.id,
      url: config.url,
      secretPrefix: config.secretPrefix,
      secretKey, // Plaintext returned ONLY ONCE upon creation
      events: config.events as WebhookEventType[],
      status: 'ACTIVE',
      createdAt: config.createdAt.toISOString(),
    };
  }

  static async listWebhooks(userId: string): Promise<WebhookConfigData[]> {
    try {
      const list = await prisma.webhookConfig.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return list.map((w) => ({
        id: w.id,
        url: w.url,
        secretPrefix: w.secretPrefix,
        events: w.events as WebhookEventType[],
        status: w.status,
        createdAt: w.createdAt.toISOString(),
      }));
    } catch {
      return [];
    }
  }

  static async deleteWebhook(id: string, userId: string): Promise<boolean> {
    try {
      const res = await prisma.webhookConfig.deleteMany({
        where: { id, userId },
      });
      return res.count > 0;
    } catch {
      return false;
    }
  }

  static async dispatchEvent(userId: string, event: WebhookEventType, payload: any) {
    try {
      const webhooks = await prisma.webhookConfig.findMany({
        where: { userId, status: 'ACTIVE' },
      });

      const targets = webhooks.filter((w) => w.events.includes(event));
      for (const target of targets) {
        this.triggerDelivery(target.id, target.url, target.secretHash, event, payload).catch(() => {});
      }
    } catch (err: any) {
      logger.warn({ error: err.message }, 'Failed to dispatch webhook event');
    }
  }

  private static async triggerDelivery(webhookId: string, url: string, secretHash: string, event: string, payload: any) {
    const timestamp = Date.now().toString();
    const rawPayload = JSON.stringify({ event, timestamp, data: payload });
    const signature = CryptoUtils.signWebhookPayload(rawPayload, secretHash);

    const start = Date.now();
    let status: 'SUCCESS' | 'FAILED' = 'FAILED';
    let code: number | undefined;
    let responseText: string | undefined;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MediaHub-Event': event,
          'X-MediaHub-Timestamp': timestamp,
          'X-MediaHub-Signature': signature,
        },
        body: rawPayload,
      });

      code = res.status;
      status = res.ok ? 'SUCCESS' : 'FAILED';
      responseText = await res.text().catch(() => '');
    } catch (err: any) {
      responseText = err.message;
    }

    const durationMs = Date.now() - start;

    try {
      await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event,
          payload,
          responseCode: code,
          responseBody: responseText?.slice(0, 500),
          durationMs,
          status,
        },
      });
    } catch {}
  }
}
