import { describe, it, expect } from 'vitest';
import { mediaHubEvents } from '../src/events';

describe('MediaHubEventBus', () => {
  it('should emit and receive typed domain events', async () => {
    let received = false;

    mediaHubEvents.on('download:completed', (envelope) => {
      received = envelope.payload.jobId === 'job-100';
    });

    mediaHubEvents.emit('download:completed', { jobId: 'job-100', url: 'https://youtube.com', bytesSent: 1000 });
    expect(received).toBe(true);
  });
});
