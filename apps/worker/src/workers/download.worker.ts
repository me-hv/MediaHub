import { globalQueueManager } from '@mediahub/queue';
import { mediaHubEvents } from '@mediahub/events';

export class DownloadWorker {
  static start() {
    console.log('[Worker Module] DownloadWorker initialized listening to queue "downloads"...');
    mediaHubEvents.on('download:started', (payload) => {
      console.log(`[DownloadWorker] Job ${payload.jobId} download processing started.`);
    });
  }
}
