import { describe, it, expect } from 'vitest';
import { BackgroundWorkerDaemon } from '../src/worker';

describe('BackgroundWorkerDaemon', () => {
  it('should initialize without error', () => {
    expect(() => BackgroundWorkerDaemon.start()).not.toThrow();
  });
});
