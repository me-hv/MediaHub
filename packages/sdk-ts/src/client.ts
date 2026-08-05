import { MediaMetadata, PlaylistMetadata, ApiKeyItemData, WebhookConfigData, ApiIntrospectionData, OrganizationData, ProjectData, MembershipData, SubscriptionData } from '@mediahub/types';

export interface MediaHubClientOptions {
  apiKey: string;
  organizationId?: string;
  baseUrl?: string;
}

export class MediaHubClient {
  private apiKey: string;
  private organizationId?: string;
  private baseUrl: string;

  constructor(options: MediaHubClientOptions) {
    this.apiKey = options.apiKey;
    this.organizationId = options.organizationId;
    this.baseUrl = options.baseUrl || 'http://localhost:4000/api/v1';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...(options.headers as Record<string, string>),
    };

    if (this.organizationId) {
      headers['x-organization-id'] = this.organizationId;
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || `API Request failed with status ${res.status}`);
    }
    return json.data;
  }

  // Introspection
  async me(): Promise<ApiIntrospectionData> {
    return this.request<ApiIntrospectionData>('/public/me');
  }

  // Namespaced Audio Operations
  audio = {
    analyze: async (url: string): Promise<any> => {
      return this.request('/audio/analyze', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
    },
    download: async (url: string, format = 'mp3', bitrate = '320'): Promise<Blob> => {
      const res = await fetch(`${this.baseUrl}/audio/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ url, format, bitrate }),
      });
      if (!res.ok) throw new Error('Audio download failed');
      return await res.blob();
    },
    album: async (url: string): Promise<any> => {
      return this.request('/audio/album', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
    },
    playlist: async (url: string): Promise<any> => {
      return this.request('/audio/album', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
    },
  };

  // Namespaced Organizations & Projects
  orgs = {
    list: async (): Promise<OrganizationData[]> => {
      const res = await this.request<{ organizations: OrganizationData[] }>('/orgs');
      return res.organizations;
    },
    create: async (name: string): Promise<OrganizationData> => {
      const res = await this.request<{ organization: OrganizationData }>('/orgs', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      return res.organization;
    },
    members: async (orgSlug: string): Promise<MembershipData[]> => {
      const res = await this.request<{ members: MembershipData[] }>(`/orgs/${orgSlug}/members`);
      return res.members;
    },
  };

  projects = {
    list: async (orgSlug: string): Promise<ProjectData[]> => {
      const res = await this.request<{ projects: ProjectData[] }>(`/orgs/${orgSlug}/projects`);
      return res.projects;
    },
    create: async (orgSlug: string, name: string, environment = 'PRODUCTION'): Promise<ProjectData> => {
      const res = await this.request<{ project: ProjectData }>(`/orgs/${orgSlug}/projects`, {
        method: 'POST',
        body: JSON.stringify({ name, environment }),
      });
      return res.project;
    },
  };

  // Namespaced Media Operations
  media = {
    analyze: async (url: string): Promise<MediaMetadata> => {
      const res = await this.request<{ metadata: MediaMetadata }>('/public/analyze', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      return res.metadata;
    },
    download: async (url: string, formatId = 'best'): Promise<Blob> => {
      const res = await fetch(`${this.baseUrl}/public/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ url, formatId }),
      });
      if (!res.ok) throw new Error('Download failed');
      return await res.blob();
    },
  };

  // Namespaced Playlists
  playlists = {
    analyze: async (url: string): Promise<PlaylistMetadata> => {
      const res = await this.request<{ playlist: PlaylistMetadata }>('/public/playlist/analyze', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      return res.playlist;
    },
  };

  // Namespaced History
  history = {
    list: async (): Promise<any[]> => {
      const res = await this.request<{ items: any[] }>('/public/history');
      return res.items;
    },
  };

  // Namespaced API Keys
  keys = {
    list: async (): Promise<ApiKeyItemData[]> => {
      const res = await this.request<{ keys: ApiKeyItemData[] }>('/public/keys');
      return res.keys;
    },
    create: async (name: string, scopes?: string[]): Promise<ApiKeyItemData> => {
      const res = await this.request<{ apiKey: ApiKeyItemData }>('/public/keys', {
        method: 'POST',
        body: JSON.stringify({ name, scopes }),
      });
      return res.apiKey;
    },
    revoke: async (id: string): Promise<boolean> => {
      await this.request(`/public/keys/${id}`, { method: 'DELETE' });
      return true;
    },
  };

  // Namespaced Webhooks
  webhooks = {
    list: async (): Promise<WebhookConfigData[]> => {
      const res = await this.request<{ webhooks: WebhookConfigData[] }>('/public/webhooks');
      return res.webhooks;
    },
    create: async (url: string, events: string[]): Promise<WebhookConfigData> => {
      const res = await this.request<{ webhook: WebhookConfigData }>('/public/webhooks', {
        method: 'POST',
        body: JSON.stringify({ url, events }),
      });
      return res.webhook;
    },
    delete: async (id: string): Promise<boolean> => {
      await this.request(`/public/webhooks/${id}`, { method: 'DELETE' });
      return true;
    },
  };
}
