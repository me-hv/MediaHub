import { describe, it, expect } from 'vitest';
import { QueueManager } from '../src/QueueManager';

describe('QueueManager', () => {
  it('enqueues jobs and processes them within concurrency limit', async () => {
    const queue = new QueueManager(2);
    let executedCount = 0;

    const res1 = queue.enqueue({
      jobType: 'SINGLE',
      rawUrl: 'https://youtube.com/watch?v=111',
      formatId: 'best',
      task: async () => { executedCount++; },
    });

    const res2 = queue.enqueue({
      jobType: 'SINGLE',
      rawUrl: 'https://youtube.com/watch?v=222',
      formatId: 'best',
      task: async () => { executedCount++; },
    });

    expect(res1.status).toBe('QUEUED');
    expect(res2.status).toBe('QUEUED');

    // Wait for execution
    await new Promise((r) => setTimeout(r, 100));
    expect(executedCount).toBe(2);
  });

  it('rejects duplicate URLs for active jobs', () => {
    const queue = new QueueManager(1);
    queue.enqueue({
      jobType: 'SINGLE',
      rawUrl: 'https://youtube.com/watch?v=dup',
      formatId: 'best',
      task: async () => { await new Promise((r) => setTimeout(r, 200)); },
    });

    const dupRes = queue.enqueue({
      jobType: 'SINGLE',
      rawUrl: 'https://youtube.com/watch?v=dup',
      formatId: 'best',
      task: async () => {},
    });

    expect(dupRes.status).toBe('DUPLICATE_REJECTED');
  });
});
