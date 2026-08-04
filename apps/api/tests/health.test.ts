import { describe, it, expect } from 'vitest';
import { app } from '../src/app';

describe('Hono API Health Probes', () => {
  it('should respond to /live probe with 200 OK', async () => {
    const res = await app.request('/live');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.status).toBe('alive');
  });

  it('should respond to /health probe with healthy status', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.status).toBe('healthy');
  });
});
