import { describe, it, expect } from 'vitest';
import { FFmpegManager } from '../src/ffmpeg/FFmpegManager';

describe('FFmpeg Audio Conversion Pipeline', () => {
  it('generates MP3 320kbps conversion arguments correctly', () => {
    const args = FFmpegManager.buildFFmpegArgs({ format: 'mp3', bitrate: '320' });
    expect(args).toContain('libmp3lame');
    expect(args).toContain('320k');
    expect(args).toContain('-f');
    expect(args).toContain('mp3');
  });

  it('generates FLAC Lossless conversion arguments correctly', () => {
    const args = FFmpegManager.buildFFmpegArgs({ format: 'flac', bitDepth: '16' });
    expect(args).toContain('flac');
    expect(args).toContain('s16');
    expect(args).toContain('-f');
    expect(args).toContain('flac');
  });

  it('generates WAV PCM 16-bit conversion arguments correctly', () => {
    const args = FFmpegManager.buildFFmpegArgs({ format: 'wav', bitDepth: '16' });
    expect(args).toContain('pcm_s16le');
    expect(args).toContain('-f');
    expect(args).toContain('wav');
  });

  it('generates AAC 256kbps conversion arguments correctly', () => {
    const args = FFmpegManager.buildFFmpegArgs({ format: 'm4a', bitrate: '256' });
    expect(args).toContain('aac');
    expect(args).toContain('256k');
  });

  it('generates OGG Vorbis conversion arguments correctly', () => {
    const args = FFmpegManager.buildFFmpegArgs({ format: 'ogg', bitrate: '192' });
    expect(args).toContain('libvorbis');
    expect(args).toContain('192k');
    expect(args).toContain('-f');
    expect(args).toContain('ogg');
  });
});
