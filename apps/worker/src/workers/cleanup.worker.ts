import { globalScheduler } from '@mediahub/scheduler';

export class CleanupWorker {
  static start() {
    console.log('[Worker Module] CleanupWorker initialized listening to queue "maintenance"...');
    globalScheduler.registerTask('CleanupExpiredInvitesJob', 86400000, async () => {
      console.log('[CleanupWorker] Expired invitations purged.');
    });
  }
}
