import { describe, it, expect } from 'vitest';
import { mediaHubEvents, MediaHubEventBus } from '../src';

describe('Versioned Event Bus', () => {
  it('should emit v1 versioned event envelope', () => {
    let receivedVersion = '';
    mediaHubEvents.on('media:analyzed', (envelope) => {
      receivedVersion = envelope.version;
    });

    mediaHubEvents.emit('media:analyzed', { url: 'https://youtube.com', platform: 'YOUTUBE' }, 'v1');
    expect(receivedVersion).toBe('v1');
  });

  it('should emit v2 versioned event envelope', () => {
    let receivedVersion = '';
    mediaHubEvents.on('download:queued', (envelope) => {
      receivedVersion = envelope.version;
    });

    mediaHubEvents.emit('download:queued', { jobId: 'job-1', rawUrl: 'https://youtube.com', formatId: 'best' }, 'v2');
    expect(receivedVersion).toBe('v2');
  });

  it('should generate unique event ID', () => {
    let eventId = '';
    mediaHubEvents.on('project:created', (envelope) => {
      eventId = envelope.eventId;
    });

    mediaHubEvents.emit('project:created', { projectId: 'p1', organizationId: 'o1', name: 'Test Project' });
    expect(eventId).toContain('evt_');
  });

  it('should handle subscription change events', () => {
    let plan = '';
    mediaHubEvents.on('subscription:changed', (env) => {
      plan = env.payload.newPlan;
    });

    mediaHubEvents.emit('subscription:changed', { organizationId: 'o1', newPlan: 'PRO' });
    expect(plan).toBe('PRO');
  });

  it('should handle audit event creation', () => {
    let action = '';
    mediaHubEvents.on('audit:created', (env) => {
      action = env.payload.action;
    });

    mediaHubEvents.emit('audit:created', { actorId: 'u1', action: 'KEY_CREATED', resourceType: 'ApiKey' });
    expect(action).toBe('KEY_CREATED');
  });

  it('should handle usage update events', () => {
    let count = 0;
    mediaHubEvents.on('usage:updated', (env) => {
      count = env.payload.downloads;
    });

    mediaHubEvents.emit('usage:updated', { organizationId: 'o1', downloads: 42, bytes: 1000 });
    expect(count).toBe(42);
  });

  it('should handle quota exceeded events', () => {
    let limit = 0;
    mediaHubEvents.on('quota:exceeded', (env) => {
      limit = env.payload.limit;
    });

    mediaHubEvents.emit('quota:exceeded', { organizationId: 'o1', limit: 500, used: 501 });
    expect(limit).toBe(500);
  });

  it('should handle storage uploaded events', () => {
    let provider = '';
    mediaHubEvents.on('storage:uploaded', (env) => {
      provider = env.payload.provider;
    });

    mediaHubEvents.emit('storage:uploaded', { key: 'file.mp4', bytes: 5000, provider: 'R2' });
    expect(provider).toBe('R2');
  });

  it('should handle webhook delivered events', () => {
    let status = '';
    mediaHubEvents.on('webhook:delivered', (env) => {
      status = env.payload.status;
    });

    mediaHubEvents.emit('webhook:delivered', { webhookId: 'w1', event: 'download.completed', status: 'SUCCESS' });
    expect(status).toBe('SUCCESS');
  });

  it('should handle invitation accepted events', () => {
    let role = '';
    mediaHubEvents.on('invitation:accepted', (env) => {
      role = env.payload.role;
    });

    mediaHubEvents.emit('invitation:accepted', { invitationId: 'i1', email: 'user@test.com', role: 'ADMIN' });
    expect(role).toBe('ADMIN');
  });
});
