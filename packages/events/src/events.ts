import { EventEmitter } from 'node:events';

export interface ProgressEventPayload {
  jobId: string;
  userId?: string;
  status: string;
  progress: number;
  bytesDownloaded?: number;
  totalBytes?: number;
  speed?: string;
  eta?: string;
  error?: string;
}

export interface JobEventPayload {
  jobId: string;
  userId?: string;
  rawUrl: string;
  status: string;
  error?: string;
}

export class MediaHubEventEmitter extends EventEmitter {
  emitProgress(payload: ProgressEventPayload) {
    this.emit('ProgressUpdated', payload);
  }

  emitStarted(payload: JobEventPayload) {
    this.emit('DownloadStarted', payload);
  }

  emitCompleted(payload: JobEventPayload) {
    this.emit('DownloadCompleted', payload);
  }

  emitCancelled(payload: JobEventPayload) {
    this.emit('DownloadCancelled', payload);
  }

  emitFailed(payload: JobEventPayload) {
    this.emit('DownloadFailed', payload);
  }
}

export const mediaHubEvents = new MediaHubEventEmitter();
