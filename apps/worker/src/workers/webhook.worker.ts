import { mediaHubEvents } from '@mediahub/events';

export class WebhookWorker {
  static start() {
    console.log('[Worker Module] WebhookWorker initialized listening to queue "webhooks"...');
    mediaHubEvents.on('webhook:delivered', (payload) => {
      console.log(`[WebhookWorker] Webhook ${payload.webhookId} delivery log saved.`);
    });
  }
}
