import { globalQueueManager } from '@mediahub/queue';
import { mediaHubEvents } from '@mediahub/events';

export class AudioWorker {
  static start() {
    console.log('[Worker Module] AudioWorker initialized listening to queue "audio-downloads"...');
    mediaHubEvents.on('download:started', (envelope) => {
      const payload = envelope.payload as any;
      if (payload.format === 'mp3' || payload.format === 'flac' || payload.format === 'wav') {
        console.log(`[AudioWorker] Processing audio job ${payload.jobId} (Format: ${payload.format})`);
      }
    });
  }
}
