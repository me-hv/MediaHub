import { mediaHubEvents } from '@mediahub/events';

export interface OutboxRecord {
  id: string;
  eventName: string;
  payload: any;
  status: 'PENDING' | 'DISPATCHED' | 'FAILED';
  createdAt: Date;
}

export class OutboxService {
  private static pendingStore: OutboxRecord[] = [];

  static recordEvent(eventName: string, payload: any): OutboxRecord {
    const record: OutboxRecord = {
      id: `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventName,
      payload,
      status: 'PENDING',
      createdAt: new Date(),
    };
    this.pendingStore.push(record);
    return record;
  }

  static async dispatchPending(): Promise<number> {
    const pending = [...this.pendingStore.filter((r) => r.status === 'PENDING')];
    let count = 0;

    for (const record of pending) {
      try {
        mediaHubEvents.emit(record.eventName as any, record.payload);
        record.status = 'DISPATCHED';
        count++;
      } catch {
        record.status = 'FAILED';
      }
    }

    return count;
  }

  static getPendingCount(): number {
    return this.pendingStore.filter((r) => r.status === 'PENDING').length;
  }
}
