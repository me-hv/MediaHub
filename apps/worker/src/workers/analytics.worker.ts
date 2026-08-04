import { mediaHubEvents } from '@mediahub/events';

export class AnalyticsWorker {
  static start() {
    console.log('[Worker Module] AnalyticsWorker initialized listening to queue "analytics"...');
    mediaHubEvents.on('usage:updated', (payload) => {
      console.log(`[AnalyticsWorker] Usage updated for org ${payload.organizationId}: ${payload.downloads} downloads.`);
    });
  }
}
