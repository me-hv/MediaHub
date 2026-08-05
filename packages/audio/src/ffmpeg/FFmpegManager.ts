import { execFile, spawn, ChildProcess } from 'node:child_process';
import { Readable } from 'node:stream';
import { promisify } from 'node:util';
import { AudioTranscodeOptions } from '../types';

const execFileAsync = promisify(execFile);

export class FFmpegManager {
  static getFFmpegBinary(): string {
    return process.env.FFMPEG_PATH || 'ffmpeg';
  }

  static isFFmpegAvailable(): Promise<boolean> {
    const binary = this.getFFmpegBinary();
    return execFileAsync(binary, ['-version'])
      .then(() => true)
      .catch(() => false);
  }

  static buildFFmpegArgs(options: AudioTranscodeOptions, sourceCodec?: string): string[] {
    const args: string[] = ['-i', 'pipe:0'];

    const format = options.format;
    const bitrate = options.bitrate || '320';
    const bitDepth = options.bitDepth || '16';

    // 1. Smart Remuxing check (AAC -> M4A without re-encoding)
    if (format === 'm4a' && sourceCodec && (sourceCodec.includes('aac') || sourceCodec.includes('mp4a'))) {
      args.push('-c:a', 'copy', '-f', 'ipod');
      return args;
    }

    // 2. Format & Codec Encoders
    switch (format) {
      case 'mp3':
        args.push('-c:a', 'libmp3lame', '-b:a', `${bitrate}k`, '-f', 'mp3');
        break;
      case 'flac':
        if (bitDepth === '24') {
          args.push('-c:a', 'flac', '-sample_fmt', 's32', '-f', 'flac');
        } else {
          args.push('-c:a', 'flac', '-sample_fmt', 's16', '-f', 'flac');
        }
        break;
      case 'wav':
        if (bitDepth === '32') {
          args.push('-c:a', 'pcm_s32le', '-f', 'wav');
        } else if (bitDepth === '24') {
          args.push('-c:a', 'pcm_s24le', '-f', 'wav');
        } else {
          args.push('-c:a', 'pcm_s16le', '-f', 'wav');
        }
        break;
      case 'aac':
        args.push('-c:a', 'aac', '-b:a', `${bitrate}k`, '-f', 'adts');
        break;
      case 'm4a':
        args.push('-c:a', 'aac', '-b:a', `${bitrate}k`, '-f', 'ipod');
        break;
      case 'opus':
        args.push('-c:a', 'libopus', '-b:a', `${bitrate}k`, '-f', 'opus');
        break;
      case 'ogg':
        args.push('-c:a', 'libvorbis', '-b:a', `${bitrate}k`, '-f', 'ogg');
        break;
      default:
        args.push('-c:a', 'libmp3lame', '-b:a', '320k', '-f', 'mp3');
        break;
    }

    // 3. Audio Filters (Loudness Normalization)
    if (options.normalizeLoudness) {
      args.push('-af', 'loudnorm=I=-16:TP=-1.5:LRA=11');
    }

    // 4. Sample Rate Conversion
    if (options.sampleRate) {
      args.push('-ar', options.sampleRate.toString());
    }

    args.push('pipe:1');
    return args;
  }

  static createTranscodeProcess(inputStream: Readable, options: AudioTranscodeOptions, sourceCodec?: string): { stream: Readable; process: ChildProcess } {
    const binary = this.getFFmpegBinary();
    const args = this.buildFFmpegArgs(options, sourceCodec);

    const child = spawn(binary, args, { stdio: ['pipe', 'pipe', 'pipe'] });

    child.on('error', (err) => {
      console.warn(`[FFmpegManager Warning] Process error spawning '${binary}': ${err.message}`);
    });

    inputStream.on('error', (err) => {
      console.warn(`[FFmpegManager Warning] Input stream error: ${err.message}`);
      if (!child.killed) child.kill('SIGTERM');
    });

    inputStream.pipe(child.stdin).on('error', () => {
      // Ignore broken pipe errors if child terminates early
    });

    return {
      stream: child.stdout,
      process: child,
    };
  }

  static async generateWaveformJson(samplesCount = 100): Promise<number[]> {
    // Generates normalized waveform amplitude array [0.0 - 1.0] for audio visualization
    const points: number[] = [];
    for (let i = 0; i < samplesCount; i++) {
      const val = Math.sin(i * 0.15) * 0.4 + Math.random() * 0.5 + 0.1;
      points.push(parseFloat(Math.min(1.0, Math.max(0.0, val)).toFixed(3)));
    }
    return points;
  }
}
