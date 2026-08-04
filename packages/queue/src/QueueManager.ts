import { mediaHubEvents } from '@mediahub/events';

export type JobStatus = 'QUEUED' | 'DOWNLOADING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface EnqueueJobOptions {
  userId?: string;
  jobType: 'SINGLE' | 'BATCH' | 'PLAYLIST';
  rawUrl: string;
  formatId?: string;
  priority?: number; // 0 (normal) to 10 (high)
  task: () => Promise<void>;
}

export interface QueueJobState {
  id: string;
  userId?: string;
  jobType: string;
  rawUrl: string;
  formatId: string;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  progress: number;
  speed?: string;
  eta?: string;
  bytesDownloaded?: number;
  totalBytes?: number;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  error?: string;
}

export class QueueManager {
  private activeJobs = new Map<string, QueueJobState>();
  private pendingQueue: Array<{ id: string; priority: number; task: () => Promise<void> }> = [];
  private activeWorkerCount = 0;
  private maxConcurrency = 3;
  private deadLetterQueue: QueueJobState[] = [];

  constructor(maxConcurrency = 3) {
    this.maxConcurrency = maxConcurrency;
  }

  enqueue(options: EnqueueJobOptions): { jobId: string; status: 'QUEUED' | 'DUPLICATE_REJECTED' } {
    const existingActive = Array.from(this.activeJobs.values()).find(
      (j) => j.rawUrl === options.rawUrl && (j.status === 'QUEUED' || j.status === 'DOWNLOADING')
    );

    if (existingActive) {
      return { jobId: existingActive.id, status: 'DUPLICATE_REJECTED' };
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const priority = options.priority ?? 5;

    const state: QueueJobState = {
      id: jobId,
      userId: options.userId,
      jobType: options.jobType,
      rawUrl: options.rawUrl,
      formatId: options.formatId || 'best',
      status: 'QUEUED',
      priority,
      attempts: 0,
      maxAttempts: 3,
      progress: 0,
      createdAt: new Date(),
    };

    this.activeJobs.set(jobId, state);
    this.pendingQueue.push({ id: jobId, priority, task: options.task });
    this.pendingQueue.sort((a, b) => b.priority - a.priority);

    mediaHubEvents.emit('ProgressUpdated', { jobId, status: 'QUEUED', progress: 0, userId: options.userId });

    this.processNext();
    return { jobId, status: 'QUEUED' };
  }

  private async processNext() {
    if (this.activeWorkerCount >= this.maxConcurrency || this.pendingQueue.length === 0) {
      return;
    }

    const nextItem = this.pendingQueue.shift();
    if (!nextItem) return;

    const state = this.activeJobs.get(nextItem.id);
    if (!state || state.status === 'CANCELLED') return;

    this.activeWorkerCount++;
    state.status = 'DOWNLOADING';
    state.startedAt = new Date();
    state.attempts++;

    mediaHubEvents.emit('ProgressUpdated', { jobId: state.id, status: 'DOWNLOADING', progress: 5, userId: state.userId });

    try {
      await nextItem.task();
      state.status = 'COMPLETED';
      state.progress = 100;
      state.finishedAt = new Date();
      mediaHubEvents.emit('DownloadCompleted', { jobId: state.id, rawUrl: state.rawUrl, userId: state.userId });
    } catch (err: any) {
      state.error = err.message;
      if (state.attempts < state.maxAttempts) {
        state.status = 'QUEUED';
        this.pendingQueue.push(nextItem);
      } else {
        state.status = 'FAILED';
        state.finishedAt = new Date();
        this.deadLetterQueue.push(state);
        mediaHubEvents.emit('DownloadFailed', { jobId: state.id, error: err.message, userId: state.userId });
      }
    } finally {
      this.activeWorkerCount--;
      this.processNext();
    }
  }

  cancelJob(jobId: string): boolean {
    const state = this.activeJobs.get(jobId);
    if (state && (state.status === 'QUEUED' || state.status === 'DOWNLOADING')) {
      state.status = 'CANCELLED';
      state.finishedAt = new Date();
      this.pendingQueue = this.pendingQueue.filter((item) => item.id !== jobId);
      mediaHubEvents.emit('DownloadCancelled', { jobId, userId: state.userId });
      return true;
    }
    return false;
  }

  getJob(jobId: string): QueueJobState | undefined {
    return this.activeJobs.get(jobId);
  }

  getAllJobs(userId?: string): QueueJobState[] {
    const all = Array.from(this.activeJobs.values());
    if (userId) {
      return all.filter((j) => j.userId === userId);
    }
    return all;
  }

  getDeadLetterQueue(): QueueJobState[] {
    return this.deadLetterQueue;
  }

  getStats() {
    return {
      activeWorkers: this.activeWorkerCount,
      maxConcurrency: this.maxConcurrency,
      pendingCount: this.pendingQueue.length,
      totalActiveCount: this.activeJobs.size,
      deadLetterCount: this.deadLetterQueue.length,
    };
  }
}

export const globalQueueManager = new QueueManager(3);
