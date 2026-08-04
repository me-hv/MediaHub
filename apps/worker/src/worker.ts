import { DownloadWorker } from './workers/download.worker';
import { WebhookWorker } from './workers/webhook.worker';
import { AnalyticsWorker } from './workers/analytics.worker';
import { CleanupWorker } from './workers/cleanup.worker';
import { globalShutdownManager } from '@mediahub/platform';

export class BackgroundWorkerDaemon {
  static start() {
    console.log('[MediaHub Worker Daemon] Initializing background processors...');

    DownloadWorker.start();
    WebhookWorker.start();
    AnalyticsWorker.start();
    CleanupWorker.start();

    globalShutdownManager.register('BackgroundWorkerDaemon', async () => {
      console.log('[Worker Daemon] Gracefully shutting down worker listeners...');
    });

    console.log('[MediaHub Worker Daemon] Background worker online and listening.');
  }
}

if (require.main === module) {
  BackgroundWorkerDaemon.start();
}
