import { describe, it, expect } from 'vitest';
import { SchedulerService } from '../src/SchedulerService';

describe('SchedulerService', () => {
  it('should register and execute scheduled cron task', async () => {
    const scheduler = new SchedulerService();
    let executed = false;

    scheduler.registerTask('CleanupInvitesJob', 3600000, async () => {
      executed = true;
    });

    expect(scheduler.getTaskNames()).toContain('CleanupInvitesJob');
    const ok = await scheduler.runTask('CleanupInvitesJob');
    expect(ok).toBe(true);
    expect(executed).toBe(true);
  });
});
