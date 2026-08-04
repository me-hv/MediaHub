import { describe, it, expect } from 'vitest';
import { MediaHubClient } from '../src';

describe('MediaHubClient SDK', () => {
  it('should instantiate client with API key & organization context', () => {
    const client = new MediaHubClient({
      apiKey: 'mh_live_test_key_123',
      organizationId: 'org-acme',
    });

    expect(client).toBeDefined();
    expect(client.orgs).toBeDefined();
    expect(client.projects).toBeDefined();
    expect(client.media).toBeDefined();
  });
});
