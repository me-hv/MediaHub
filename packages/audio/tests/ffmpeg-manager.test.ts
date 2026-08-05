import { describe, it, expect } from 'vitest';
import { FFmpegManager } from '../src/ffmpeg/FFmpegManager';

describe('FFmpegManager', () => {
  it('builds MP3 320kbps FFmpeg argument tuple', () => {
    const args = FFmpegManager.buildFFmpegArgs({ format: 'mp3', bitrate: '320' });
    expect(args).toContain('libmp3lame');
    expect(args).toContain('320k');
  });

  it('builds Lossless FLAC 24-bit FFmpeg argument tuple', () => {
    const args = FFmpegManager.buildFFmpegArgs({ format: 'flac', bitDepth: '24' });
    expect(args).toContain('flac');
    expect(args).toContain('s32');
  });

  it('builds WAV PCM 24-bit FFmpeg argument tuple', () => {
    const args = FFmpegManager.buildFFmpegArgs({ format: 'wav', bitDepth: '24' });
    expect(args).toContain('pcm_s24le');
  });

  it('performs smart remuxing for AAC source to M4A container', () => {
    const args = FFmpegManager.buildFFmpegArgs({ format: 'm4a' }, 'aac');
    expect(args).toContain('-c:a');
    expect(args).toContain('copy');
    expect(args).toContain('-f');
    expect(args).toContain('ipod');
  });

  it('applies loudness normalization filter when requested', () => {
    const args = FFmpegManager.buildFFmpegArgs({ format: 'mp3', normalizeLoudness: true });
    expect(args).toContain('-af');
    expect(args).toContain('loudnorm=I=-16:TP=-1.5:LRA=11');
  });

  it('generates waveform amplitude points', async () => {
    const waveform = await FFmpegManager.generateWaveformJson(50);
    expect(waveform).toHaveLength(50);
    expect(waveform[0]).toBeGreaterThanOrEqual(0);
    expect(waveform[0]).toBeLessThanOrEqual(1);
  });
});
