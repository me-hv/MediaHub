import { MediaMetadata } from './media';

export type ApiScope =
  | 'media.read'
  | 'media.download'
  | 'playlist.read'
  | 'history.read'
  | 'history.write'
  | 'favorites.read'
  | 'favorites.write'
  | 'admin';

export type WebhookEventType =
  | 'download.completed'
  | 'download.failed'
  | 'playlist.completed'
  | 'queue.completed';

export type OrganizationRoleData = 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'VIEWER';
export type PlanTierData = 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

export interface APIResponseSuccess<T> {
  success: true;
  data: T;
  timestamp: string;
  requestId: string;
}

export interface APIResponseError {
  success: false;
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  requestId: string;
}

export type APIResponse<T> = APIResponseSuccess<T> | APIResponseError;

export interface AnalyzeMediaResponseData {
  metadata: MediaMetadata;
}

export interface UserSettingsData {
  defaultFormat: string;
  defaultQuality: string;
  filenameTemplate: string;
  autoAnalyze: boolean;
  maxConcurrentDownloads: number;
  theme: string;
}

export interface DashboardStatsData {
  downloadsToday: number;
  downloadsThisWeek: number;
  totalDownloads: number;
  topPlatform: string;
  cacheHitPercent: number;
  recentActivity: Array<{
    id: string;
    title: string;
    platform: string;
    downloadedAt: string;
    status: string;
  }>;
}

export interface DownloadHistoryItemData {
  id: string;
  rawUrl: string;
  title: string;
  platform: string;
  formatId: string;
  mediaType: string;
  status: string;
  downloadedAt: string;
}

export interface FavoriteItemData {
  id: string;
  rawUrl: string;
  providerVideoId?: string;
  title: string;
  platform: string;
  createdAt: string;
}

export interface ApiKeyItemData {
  id: string;
  name: string;
  keyPrefix: string;
  secretKey?: string; // Only returned once on creation
  scopes: ApiScope[];
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface WebhookConfigData {
  id: string;
  url: string;
  secretPrefix: string;
  secretKey?: string; // Only returned once on creation
  events: WebhookEventType[];
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}

export interface WebhookDeliveryData {
  id: string;
  event: string;
  responseCode?: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  durationMs?: number;
  createdAt: string;
}

export interface ApiIntrospectionData {
  keyId: string;
  keyPrefix: string;
  scopes: ApiScope[];
  user: {
    id: string;
    email: string;
  };
  rateLimit: {
    limit: number;
    remaining: number;
    resetSeconds: number;
  };
  quota: {
    monthlyDownloadsLimit: number;
    downloadsUsed: number;
  };
}

export interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRoleData;
  plan: PlanTierData;
  membersCount: number;
  projectsCount: number;
  createdAt: string;
}

export interface ProjectData {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  environment: string;
  status: string;
  createdAt: string;
}

export interface MembershipData {
  id: string;
  userId: string;
  email: string;
  displayName?: string;
  role: OrganizationRoleData;
  createdAt: string;
}

export interface SubscriptionData {
  id: string;
  organizationId: string;
  plan: PlanTierData;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd?: string;
}

export interface InvoiceData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface UsageCounterData {
  month: string;
  downloads: number;
  apiRequests: number;
  storageBytes: string;
  bandwidthBytes: string;
  queueJobs: number;
  playlistAnalyses: number;
  audioExtractions: number;
  subtitleDownloads: number;
}
