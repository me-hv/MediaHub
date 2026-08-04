import { mediaHubEvents } from '@mediahub/events';
import { globalShutdownManager } from '@mediahub/platform';

export class BackgroundWorkerDaemon {
  static start() {
    console.log('[MediaHub Worker Daemon] Initializing background processors...');

    // Subscribe to internal event bus
    mediaHubEvents.on('download:completed', (payload) => {
      console.log(`[Worker EventBus] Download completed event received for job ${payload.jobId}`);
    });

    mediaHubEvents.on('download:failed', (payload) => {
      console.error(`[Worker EventBus] Download failed event received for job ${payload.jobId}: ${payload.error}`);
    });

    // Register shutdown handler
    globalShutdownManager.register('BackgroundWorkerDaemon', async () => {
      console.log('[Worker Daemon] Gracefully shutting down worker listeners...');
    });

    console.log('[MediaHub Worker Daemon] Background worker online and listening.');
  }
}

if (require.main === module) {
  BackgroundWorkerDaemon.start();
}
