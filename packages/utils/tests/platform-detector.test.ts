import { describe, it, expect } from 'vitest';
import { detectPlatform } from '../src/platform-detector';

describe('detectPlatform', () => {
  it('detects YouTube URLs correctly', () => {
    expect(detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('YOUTUBE');
    expect(detectPlatform('https://youtu.be/dQw4w9WgXcQ')).toBe('YOUTUBE');
  });

  it('detects Instagram URLs', () => {
    expect(detectPlatform('https://www.instagram.com/p/C_12345')).toBe('INSTAGRAM');
  });

  it('detects X / Twitter URLs', () => {
    expect(detectPlatform('https://x.com/user/status/123456789')).toBe('X');
    expect(detectPlatform('https://twitter.com/user/status/123456789')).toBe('X');
  });

  it('returns UNKNOWN for unsupported domains', () => {
    expect(detectPlatform('https://example.com/video.mp4')).toBe('UNKNOWN');
  });
});
