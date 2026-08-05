import { describe, it, expect } from 'vitest';
import { ExecutableResolver, ExecutableValidator } from '../src';

describe('ExecutableResolver & ExecutableValidator', () => {
  it('should discover candidate executable search paths', () => {
    const candidates = ExecutableResolver.getCandidates();
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.some((c) => c.displayPath.includes('yt-dlp') || c.displayPath.includes('yt_dlp'))).toBe(true);
  });

  it('should resolve yt-dlp binary status', async () => {
    const resolved = await ExecutableResolver.resolveYtDlp();
    expect(resolved).toBeDefined();
    expect(typeof resolved.available).toBe('boolean');
  });

  it('should validate startup dependencies cleanly', async () => {
    const status = await ExecutableValidator.validateStartup();
    expect(status).toHaveProperty('ytDlpAvailable');
    expect(status).toHaveProperty('ffmpegAvailable');
  });
});
