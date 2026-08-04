import EventEmitter from 'events';

export interface EventEnvelope<T = any> {
  eventId: string;
  eventName: string;
  version: 'v1' | 'v2';
  timestamp: string;
  payload: T;
}

export type DomainEventMap = {
  'media:analyzed': { url: string; platform: string; duration?: number };
  'download:queued': { jobId: string; rawUrl: string; formatId: string };
  'download:started': { jobId: string; startTime: string };
  'download:progress': { jobId: string; progress: number; downloadSpeed?: string };
  'download:completed': { jobId: string; url: string; bytesSent: number };
  'download:failed': { jobId: string; error: string };
  'playlist:expanded': { playlistId: string; count: number };
  'storage:uploaded': { key: string; bytes: number; provider: string };
  'quota:exceeded': { organizationId: string; limit: number; used: number };
  'webhook:delivered': { webhookId: string; event: string; status: string };
  'subscription:changed': { organizationId: string; newPlan: string };
  'project:created': { projectId: string; organizationId: string; name: string };
  'invitation:accepted': { invitationId: string; email: string; role: string };
  'audit:created': { actorId: string; action: string; resourceType: string };
  'usage:updated': { organizationId: string; downloads: number; bytes: number };
};

export class MediaHubEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  emit<K extends keyof DomainEventMap>(event: K, payload: DomainEventMap[K], version: 'v1' | 'v2' = 'v1'): boolean {
    const envelope: EventEnvelope<DomainEventMap[K]> = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventName: event,
      version,
      timestamp: new Date().toISOString(),
      payload,
    };
    return this.emitter.emit(event, envelope);
  }

  on<K extends keyof DomainEventMap>(event: K, listener: (envelope: EventEnvelope<DomainEventMap[K]>) => void): this {
    this.emitter.on(event, listener as any);
    return this;
  }

  off<K extends keyof DomainEventMap>(event: K, listener: (envelope: EventEnvelope<DomainEventMap[K]>) => void): this {
    this.emitter.off(event, listener as any);
    return this;
  }
}

export const mediaHubEvents = new MediaHubEventBus();
