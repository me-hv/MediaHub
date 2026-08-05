import { DownloadWorker } from './workers/download.worker';
import { AudioWorker } from './workers/audio.worker';
import { WebhookWorker } from './workers/webhook.worker';
import { AnalyticsWorker } from './workers/analytics.worker';
import { CleanupWorker } from './workers/cleanup.worker';
import { globalShutdownManager } from '@mediahub/platform';
import { ExecutableValidator } from '@mediahub/downloader';

export class BackgroundWorkerDaemon {
  static async start() {
    console.log('[MediaHub Worker Daemon] Initializing background processors...');

    await ExecutableValidator.validateStartup().catch((err) => {
      console.warn(`[Worker Daemon] Executable validation warning: ${err.message}`);
    });

    DownloadWorker.start();
    AudioWorker.start();
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
