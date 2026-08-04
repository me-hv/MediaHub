import { describe, it, expect } from 'vitest';
import { OutboxService } from '../src/OutboxService';

describe('OutboxService', () => {
  it('should record event atomically in outbox store', () => {
    const record = OutboxService.recordEvent('download:queued', { jobId: 'job-555' });
    expect(record.status).toBe('PENDING');
    expect(record.eventName).toBe('download:queued');
  });

  it('should dispatch pending outbox events asynchronously', async () => {
    OutboxService.recordEvent('download:completed', { jobId: 'job-999', url: 'https://youtube.com', bytesSent: 500 });
    const count = await OutboxService.dispatchPending();
    expect(count).toBeGreaterThan(0);
  });
});
