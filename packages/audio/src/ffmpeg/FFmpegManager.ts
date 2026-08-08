import { execFile, spawn, ChildProcess } from 'node:child_process';
import { Readable } from 'node:stream';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { AudioTranscodeOptions } from '../types';
import { ExecutableResolver } from '@mediahub/downloader';

const execFileAsync = promisify(execFile);

export class FFmpegManager {
  private static cachedBinaryPath: string | null = null;

  static async resolveFFmpegBinary(): Promise<string> {
    if (this.cachedBinaryPath) return this.cachedBinaryPath;

    // 1. Explicit env variables
    const customPath = process.env.MEDIAHUB_FFMPEG_PATH || process.env.FFMPEG_PATH;
    if (customPath && fs.existsSync(customPath)) {
      this.cachedBinaryPath = customPath;
      return customPath;
    }

    // 2. ExecutableResolver candidate search
    const resolved = await ExecutableResolver.resolveFfmpeg();
    if (resolved.available && resolved.command) {
      this.cachedBinaryPath = resolved.command;
      return resolved.command;
    }

    // 3. Fallback
    this.cachedBinaryPath = customPath || 'ffmpeg';
    return this.cachedBinaryPath;
  }

  static getFFmpegBinary(): string {
    const customPath = process.env.MEDIAHUB_FFMPEG_PATH || process.env.FFMPEG_PATH;
    if (customPath && fs.existsSync(customPath)) return customPath;
    if (this.cachedBinaryPath) return this.cachedBinaryPath;
    return 'ffmpeg';
  }

  static async isFFmpegAvailable(): Promise<boolean> {
    try {
      const binary = await this.resolveFFmpegBinary();
      const { stdout } = await execFileAsync(binary, ['-version'], { timeout: 4000 });
      return stdout.includes('ffmpeg version') || stdout.length > 0;
    } catch {
      return false;
    }
  }

  static buildFFmpegFileArgs(options: AudioTranscodeOptions, sourceCodec?: string): string[] {
    const args: string[] = [];

    const format = options.format;
    const bitrate = options.bitrate || '320';
    const bitDepth = options.bitDepth || '16';

    // 1. Smart Remuxing check (AAC -> M4A without re-encoding)
    if (format === 'm4a' && sourceCodec && (sourceCodec.includes('aac') || sourceCodec.includes('mp4a'))) {
      args.push('-c:a', 'copy');
      return args;
    }

    // 2. Format & Codec Encoders
    switch (format) {
      case 'mp3':
        args.push('-c:a', 'libmp3lame', '-b:a', `${bitrate}k`);
        break;
      case 'flac':
        if (bitDepth === '24') {
          args.push('-c:a', 'flac', '-sample_fmt', 's32');
        } else {
          args.push('-c:a', 'flac', '-sample_fmt', 's16');
        }
        break;
      case 'wav':
        if (bitDepth === '32') {
          args.push('-c:a', 'pcm_s32le');
        } else if (bitDepth === '24') {
          args.push('-c:a', 'pcm_s24le');
        } else {
          args.push('-c:a', 'pcm_s16le');
        }
        break;
      case 'aac':
      case 'm4a':
        args.push('-c:a', 'aac', '-b:a', `${bitrate}k`);
        break;
      case 'opus':
        args.push('-c:a', 'libopus', '-b:a', `${bitrate}k`);
        break;
      case 'ogg':
        args.push('-c:a', 'libvorbis', '-b:a', `${bitrate}k`);
        break;
      default:
        args.push('-c:a', 'libmp3lame', '-b:a', '320k');
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

    return args;
  }

  static buildFFmpegArgs(options: AudioTranscodeOptions, sourceCodec?: string): string[] {
    const args: string[] = ['-i', 'pipe:0'];

    const format = options.format;
    const bitrate = options.bitrate || '320';
    const bitDepth = options.bitDepth || '16';

    if (format === 'm4a' && sourceCodec && (sourceCodec.includes('aac') || sourceCodec.includes('mp4a'))) {
      args.push('-c:a', 'copy', '-f', 'ipod');
      return args;
    }

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

    if (options.normalizeLoudness) {
      args.push('-af', 'loudnorm=I=-16:TP=-1.5:LRA=11');
    }

    if (options.sampleRate) {
      args.push('-ar', options.sampleRate.toString());
    }

    args.push('pipe:1');
    return args;
  }

  static async transcodeFileToFile(
    inputPath: string,
    outputPath: string,
    options: AudioTranscodeOptions,
    sourceCodec?: string
  ): Promise<{ path: string; size: number }> {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`FFmpeg input file missing at '${inputPath}'.`);
    }

    const inputStat = fs.statSync(inputPath);
    if (inputStat.size === 0) {
      throw new Error(`FFmpeg input file at '${inputPath}' is 0 bytes.`);
    }

    const binary = await this.resolveFFmpegBinary();
    const codecArgs = this.buildFFmpegFileArgs(options, sourceCodec);
    const args = ['-y', '-i', inputPath, ...codecArgs, outputPath];

    console.log(`[FFmpeg Transcode] Executing: ${binary} ${args.join(' ')}`);
    console.log(`  Source: ${inputPath} (${(inputStat.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`  Target: ${outputPath}`);

    const startTime = Date.now();
    try {
      const { stderr } = await execFileAsync(binary, args, { timeout: 120000 });

      if (!fs.existsSync(outputPath)) {
        throw new Error(`FFmpeg completed but output file '${outputPath}' was not generated. Stderr: ${stderr}`);
      }

      const outputStat = fs.statSync(outputPath);
      if (outputStat.size === 0) {
        try { fs.unlinkSync(outputPath); } catch {}
        throw new Error(`FFmpeg generated a 0-byte output file at '${outputPath}'. Stderr: ${stderr}`);
      }

      const durationMs = Date.now() - startTime;
      console.log(`[FFmpeg Transcode Success] Output generated: ${outputPath} | Size: ${(outputStat.size / 1024 / 1024).toFixed(2)} MB | Duration: ${durationMs}ms`);

      return { path: outputPath, size: outputStat.size };
    } catch (err: any) {
      if (fs.existsSync(outputPath)) {
        try { fs.unlinkSync(outputPath); } catch {}
      }
      throw new Error(`FFmpeg conversion failed: ${err.stderr || err.message}`);
    }
  }

  static async createTranscodeProcess(
    inputStream: Readable,
    options: AudioTranscodeOptions,
    sourceCodec?: string
  ): Promise<{ stream: Readable; process: ChildProcess }> {
    const binary = await this.resolveFFmpegBinary();
    const args = this.buildFFmpegArgs(options, sourceCodec);

    console.log(`[FFmpeg Stream Transcode] Spawning: ${binary} ${args.join(' ')}`);
    const child = spawn(binary, args, { stdio: ['pipe', 'pipe', 'pipe'] });

    child.on('error', (err) => {
      console.warn(`[FFmpegManager Error] Failed to spawn FFmpeg binary '${binary}': ${err.message}`);
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
    const points: number[] = [];
    for (let i = 0; i < samplesCount; i++) {
      const val = Math.sin(i * 0.15) * 0.4 + Math.random() * 0.5 + 0.1;
      points.push(parseFloat(Math.min(1.0, Math.max(0.0, val)).toFixed(3)));
    }
    return points;
  }
}
