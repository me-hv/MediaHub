import { describe, it, expect } from 'vitest';
import { AudioAnalyzer } from '../src/analyzer/AudioAnalyzer';

describe('AudioAnalyzer', () => {
  it('detects YouTube Music track URLs', () => {
    const result = AudioAnalyzer.analyzeUrl('https://music.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result.isMusic).toBe(true);
    expect(result.contentType).toBe('TRACK');
  });

  it('detects YouTube Music album URLs', () => {
    const result = AudioAnalyzer.analyzeUrl('https://music.youtube.com/playlist?list=OLAK5uy_k123456');
    expect(result.isMusic).toBe(true);
    expect(result.contentType).toBe('ALBUM');
  });

  it('detects standard YouTube videos as non-primary music', () => {
    const result = AudioAnalyzer.analyzeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result.isMusic).toBe(false);
    expect(result.contentType).toBe('STANDARD_VIDEO');
  });

  it('detects live stream URLs', () => {
    const result = AudioAnalyzer.analyzeUrl('https://www.youtube.com/live/dQw4w9WgXcQ');
    expect(result.contentType).toBe('LIVE_STREAM');
  });
});
