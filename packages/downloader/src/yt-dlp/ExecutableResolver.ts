import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export interface ResolvedExecutable {
  command: string;
  args: string[];
  displayPath: string;
  version: string;
  available: boolean;
}

export class ExecutableResolver {
  private static cachedYtDlp: ResolvedExecutable | null = null;
  private static cachedFfmpeg: ResolvedExecutable | null = null;

  static getCandidates(): Array<{ command: string; args: string[]; displayPath: string }> {
    const candidates: Array<{ command: string; args: string[]; displayPath: string }> = [];

    // 1. YT_DLP_PATH env var
    if (process.env.YT_DLP_PATH) {
      candidates.push({ command: process.env.YT_DLP_PATH, args: [], displayPath: process.env.YT_DLP_PATH });
    }

    // 2. Direct binary names
    const isWin = process.platform === 'win32';
    const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
    candidates.push({ command: binName, args: [], displayPath: binName });
    candidates.push({ command: 'yt-dlp', args: [], displayPath: 'yt-dlp' });

    // 3. Python module runners (python -m yt_dlp, python3 -m yt_dlp, py -m yt_dlp)
    candidates.push({ command: 'python', args: ['-m', 'yt_dlp'], displayPath: 'python -m yt_dlp' });
    candidates.push({ command: 'python3', args: ['-m', 'yt_dlp'], displayPath: 'python3 -m yt_dlp' });
    candidates.push({ command: 'py', args: ['-m', 'yt_dlp'], displayPath: 'py -m yt_dlp' });

    // 4. Bundled binary candidates
    const cwd = process.cwd();
    candidates.push({ command: path.join(cwd, binName), args: [], displayPath: path.join(cwd, binName) });
    candidates.push({ command: path.join(cwd, 'bin', binName), args: [], displayPath: path.join(cwd, 'bin', binName) });

    return candidates;
  }

  static async resolveYtDlp(forceRefresh = false): Promise<ResolvedExecutable> {
    if (this.cachedYtDlp && !forceRefresh) return this.cachedYtDlp;

    const candidates = this.getCandidates();

    for (const cand of candidates) {
      try {
        const { stdout } = await execFileAsync(cand.command, [...cand.args, '--version'], { timeout: 4000 });
        const version = stdout.trim();
        if (version) {
          this.cachedYtDlp = {
            command: cand.command,
            args: cand.args,
            displayPath: cand.displayPath,
            version,
            available: true,
          };
          return this.cachedYtDlp;
        }
      } catch {
        // Try next candidate
      }
    }

    this.cachedYtDlp = {
      command: 'yt-dlp',
      args: [],
      displayPath: 'yt-dlp (not found)',
      version: 'unavailable',
      available: false,
    };
    return this.cachedYtDlp;
  }

  static async resolveFfmpeg(forceRefresh = false): Promise<ResolvedExecutable> {
    if (this.cachedFfmpeg && !forceRefresh) return this.cachedFfmpeg;

    const candidates: Array<{ command: string; args: string[]; displayPath: string }> = [
      ...(process.env.FFMPEG_PATH ? [{ command: process.env.FFMPEG_PATH, args: [], displayPath: process.env.FFMPEG_PATH }] : []),
      { command: process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg', args: [], displayPath: 'ffmpeg' },
      { command: 'ffmpeg', args: [], displayPath: 'ffmpeg' },
    ];

    for (const cand of candidates) {
      try {
        const { stdout } = await execFileAsync(cand.command, [...cand.args, '-version'], { timeout: 4000 });
        const match = stdout.match(/ffmpeg version ([^\s]+)/i);
        const version = match ? match[1] : 'detected';
        this.cachedFfmpeg = {
          command: cand.command,
          args: cand.args,
          displayPath: cand.displayPath,
          version,
          available: true,
        };
        return this.cachedFfmpeg;
      } catch {
        // Try next candidate
      }
    }

    this.cachedFfmpeg = {
      command: 'ffmpeg',
      args: [],
      displayPath: 'ffmpeg (not found)',
      version: 'unavailable',
      available: false,
    };
    return this.cachedFfmpeg;
  }
}
