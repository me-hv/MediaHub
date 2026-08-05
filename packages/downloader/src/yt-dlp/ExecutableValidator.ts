import { ExecutableResolver } from './ExecutableResolver';

export class ExecutableValidator {
  static async validateStartup(): Promise<{ ytDlpAvailable: boolean; ffmpegAvailable: boolean }> {
    console.log('[MediaHub Downloader] Initializing binary dependency checks...');

    const ytDlp = await ExecutableResolver.resolveYtDlp();
    if (ytDlp.available) {
      console.log(`✓ yt-dlp binary resolved via [${ytDlp.displayPath}] (Version: ${ytDlp.version})`);
    } else {
      console.warn(`⚠️ yt-dlp binary not detected in PATH, YT_DLP_PATH, or Python module. See docs/development.md`);
    }

    const ffmpeg = await ExecutableResolver.resolveFfmpeg();
    if (ffmpeg.available) {
      console.log(`✓ ffmpeg binary resolved via [${ffmpeg.displayPath}] (Version: ${ffmpeg.version})`);
    } else {
      console.log(`ℹ️ ffmpeg binary not detected (optional for basic stream extraction).`);
    }

    console.log('[MediaHub Downloader] Dependency validation complete.');
    return {
      ytDlpAvailable: ytDlp.available,
      ffmpegAvailable: ffmpeg.available,
    };
  }
}
