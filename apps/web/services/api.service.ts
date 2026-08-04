import { APIResponse, AnalyzeMediaResponseData, MediaMetadata, DashboardStatsData, UserSettingsData, PlaylistMetadata, ApiKeyItemData, WebhookConfigData, OrganizationData, ProjectData, MembershipData, SubscriptionData, InvoiceData } from '@mediahub/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiService {
  static async analyzeMedia(url: string, signal?: AbortSignal): Promise<MediaMetadata> {
    const res = await fetch(`${API_BASE}/api/v1/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal,
    });
    const json = (await res.json()) as APIResponse<AnalyzeMediaResponseData>;
    if (!res.ok || !json.success) throw new Error(json.success === false ? json.message : 'Failed to analyze URL');
    return json.data.metadata;
  }

  static async downloadMedia(url: string, formatId: string, signal?: AbortSignal): Promise<Blob> {
    const res = await fetch(`${API_BASE}/api/v1/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formatId }),
      signal,
    });
    if (!res.ok) throw new Error('Download request failed');
    return await res.blob();
  }

  static async getDashboardStats(userId: string): Promise<DashboardStatsData> {
    const res = await fetch(`${API_BASE}/api/v1/dashboard/stats`, {
      headers: { 'x-mock-user-id': userId },
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Could not fetch stats');
    return json.data.stats;
  }

  static async getHistory(userId: string, options: { search?: string; platform?: string; page?: number }) {
    const query = new URLSearchParams();
    if (options.search) query.set('search', options.search);
    if (options.platform) query.set('platform', options.platform);
    if (options.page) query.set('page', options.page.toString());

    const res = await fetch(`${API_BASE}/api/v1/history?${query.toString()}`, {
      headers: { 'x-mock-user-id': userId },
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Could not fetch history');
    return json.data;
  }

  static async deleteHistoryItem(id: string, userId: string) {
    await fetch(`${API_BASE}/api/v1/history/${id}`, {
      method: 'DELETE',
      headers: { 'x-mock-user-id': userId },
    });
  }

  static async clearHistory(userId: string) {
    await fetch(`${API_BASE}/api/v1/history`, {
      method: 'DELETE',
      headers: { 'x-mock-user-id': userId },
    });
  }

  static async getFavorites(userId: string) {
    const res = await fetch(`${API_BASE}/api/v1/favorites`, {
      headers: { 'x-mock-user-id': userId },
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Could not fetch favorites');
    return json.data;
  }

  static async addFavorite(userId: string, data: any) {
    const res = await fetch(`${API_BASE}/api/v1/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mock-user-id': userId },
      body: JSON.stringify(data),
    });
    return await res.json();
  }

  static async removeFavorite(id: string, userId: string) {
    await fetch(`${API_BASE}/api/v1/favorites/${id}`, {
      method: 'DELETE',
      headers: { 'x-mock-user-id': userId },
    });
  }

  static async getUserSettings(userId: string): Promise<UserSettingsData> {
    const res = await fetch(`${API_BASE}/api/v1/user/settings`, {
      headers: { 'x-mock-user-id': userId },
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Could not fetch settings');
    return json.data.settings;
  }

  static async updateUserSettings(userId: string, settings: UserSettingsData) {
    const res = await fetch(`${API_BASE}/api/v1/user/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-mock-user-id': userId },
      body: JSON.stringify(settings),
    });
    return await res.json();
  }

  static async analyzeBatch(urls: string[]) {
    const res = await fetch(`${API_BASE}/api/v1/batch/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Batch analyze failed');
    return json.data;
  }

  static async enqueueBatch(items: Array<{ url: string; formatId?: string }>) {
    const res = await fetch(`${API_BASE}/api/v1/batch/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Batch enqueue failed');
    return json.data;
  }

  static async analyzePlaylist(url: string): Promise<PlaylistMetadata> {
    const res = await fetch(`${API_BASE}/api/v1/playlist/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Playlist analyze failed');
    return json.data.playlist;
  }

  // Developer Platform Methods
  static async listApiKeys(userId: string): Promise<{ keys: ApiKeyItemData[] }> {
    const res = await fetch(`${API_BASE}/api/v1/public/keys`, {
      headers: { 'x-mock-user-id': userId },
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Could not fetch API keys');
    return json.data;
  }

  static async createApiKey(userId: string, name: string, scopes?: string[]): Promise<{ apiKey: ApiKeyItemData }> {
    const res = await fetch(`${API_BASE}/api/v1/public/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mock-user-id': userId },
      body: JSON.stringify({ name, scopes }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Key generation failed');
    return json.data;
  }

  static async revokeApiKey(id: string, userId: string) {
    await fetch(`${API_BASE}/api/v1/public/keys/${id}`, {
      method: 'DELETE',
      headers: { 'x-mock-user-id': userId },
    });
  }

  static async listWebhooks(userId: string): Promise<{ webhooks: WebhookConfigData[] }> {
    const res = await fetch(`${API_BASE}/api/v1/public/webhooks`, {
      headers: { 'x-mock-user-id': userId },
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Could not fetch webhooks');
    return json.data;
  }

  static async createWebhook(userId: string, url: string, events?: string[]): Promise<{ webhook: WebhookConfigData }> {
    const res = await fetch(`${API_BASE}/api/v1/public/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mock-user-id': userId },
      body: JSON.stringify({ url, events }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Webhook creation failed');
    return json.data;
  }

  static async deleteWebhook(id: string, userId: string) {
    await fetch(`${API_BASE}/api/v1/public/webhooks/${id}`, {
      method: 'DELETE',
      headers: { 'x-mock-user-id': userId },
    });
  }

  // Phase 5 Commercial SaaS Methods
  static async listUserOrganizations(userId: string): Promise<OrganizationData[]> {
    const res = await fetch(`${API_BASE}/api/v1/orgs`, {
      headers: { 'x-mock-user-id': userId },
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Could not fetch organizations');
    return json.data.organizations;
  }

  static async createOrganization(userId: string, name: string): Promise<OrganizationData> {
    const res = await fetch(`${API_BASE}/api/v1/orgs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mock-user-id': userId },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create organization');
    return json.data.organization;
  }

  static async listProjects(orgSlug: string, userId: string): Promise<{ projects: ProjectData[] }> {
    const res = await fetch(`${API_BASE}/api/v1/orgs/${orgSlug}/projects`, {
      headers: { 'x-mock-user-id': userId },
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Could not fetch projects');
    return json.data;
  }

  static async createProject(orgSlug: string, userId: string, name: string, environment = 'PRODUCTION'): Promise<{ project: ProjectData }> {
    const res = await fetch(`${API_BASE}/api/v1/orgs/${orgSlug}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mock-user-id': userId },
      body: JSON.stringify({ name, environment }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Project creation failed');
    return json.data;
  }

  static async getOrganizationMembers(orgSlug: string, userId: string): Promise<{ members: MembershipData[] }> {
    const res = await fetch(`${API_BASE}/api/v1/orgs/${orgSlug}/members`, {
      headers: { 'x-mock-user-id': userId },
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Could not fetch members');
    return json.data;
  }

  static async inviteMember(orgSlug: string, userId: string, email: string, role: string) {
    const res = await fetch(`${API_BASE}/api/v1/orgs/${orgSlug}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mock-user-id': userId },
      body: JSON.stringify({ email, role }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Invite failed');
    return json.data;
  }

  static async getBilling(orgSlug: string, userId: string): Promise<{ subscription: SubscriptionData; invoices: InvoiceData[] }> {
    const res = await fetch(`${API_BASE}/api/v1/orgs/${orgSlug}/billing`, {
      headers: { 'x-mock-user-id': userId },
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Could not fetch billing details');
    return json.data;
  }

  static async createCheckoutSession(orgSlug: string, userId: string, plan: string): Promise<{ url: string }> {
    const res = await fetch(`${API_BASE}/api/v1/orgs/${orgSlug}/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mock-user-id': userId },
      body: JSON.stringify({ plan }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Checkout session creation failed');
    return json.data.session;
  }
}
