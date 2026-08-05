import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export interface ResolvedExecutable {
  path: string;
  version: string;
  available: boolean;
}

export class ExecutableResolver {
  private static cachedYtDlp: ResolvedExecutable | null = null;
  private static cachedFfmpeg: ResolvedExecutable | null = null;

  static findYtDlpCandidatePaths(): string[] {
    const candidates: string[] = [];

    // 1. YT_DLP_PATH env var
    if (process.env.YT_DLP_PATH) {
      candidates.push(process.env.YT_DLP_PATH);
    }

    // 2. Platform-specific binary names in PATH
    const isWin = process.platform === 'win32';
    const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
    candidates.push(binName);
    candidates.push('yt-dlp');

    // 3. Local bundled binary candidate locations
    const cwd = process.cwd();
    candidates.push(path.join(cwd, binName));
    candidates.push(path.join(cwd, 'bin', binName));
    candidates.push(path.join(cwd, '..', '..', 'bin', binName));

    return candidates;
  }

  static async resolveYtDlp(forceRefresh = false): Promise<ResolvedExecutable> {
    if (this.cachedYtDlp && !forceRefresh) return this.cachedYtDlp;

    const candidates = this.findYtDlpCandidatePaths();

    for (const candidatePath of candidates) {
      try {
        const { stdout } = await execFileAsync(candidatePath, ['--version'], { timeout: 4000 });
        const version = stdout.trim();
        if (version) {
          this.cachedYtDlp = { path: candidatePath, version, available: true };
          return this.cachedYtDlp;
        }
      } catch {
        // Continue checking next candidate
      }
    }

    this.cachedYtDlp = { path: 'yt-dlp', version: 'unavailable', available: false };
    return this.cachedYtDlp;
  }

  static async resolveFfmpeg(forceRefresh = false): Promise<ResolvedExecutable> {
    if (this.cachedFfmpeg && !forceRefresh) return this.cachedFfmpeg;

    const candidates = [
      process.env.FFMPEG_PATH,
      process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg',
      'ffmpeg',
    ].filter(Boolean) as string[];

    for (const candidatePath of candidates) {
      try {
        const { stdout } = await execFileAsync(candidatePath, ['-version'], { timeout: 4000 });
        const match = stdout.match(/ffmpeg version ([^\s]+)/i);
        const version = match ? match[1] : 'detected';
        this.cachedFfmpeg = { path: candidatePath, version, available: true };
        return this.cachedFfmpeg;
      } catch {
        // Continue
      }
    }

    this.cachedFfmpeg = { path: 'ffmpeg', version: 'unavailable', available: false };
    return this.cachedFfmpeg;
  }
}
