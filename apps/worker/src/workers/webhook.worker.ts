import { mediaHubEvents } from '@mediahub/events';

export class WebhookWorker {
  static start() {
    console.log('[Worker Module] WebhookWorker initialized listening to queue "webhooks"...');
    mediaHubEvents.on('webhook:delivered', (envelope) => {
      console.log(`[WebhookWorker] Webhook ${envelope.payload.webhookId} delivery log saved.`);
    });
  }
}
