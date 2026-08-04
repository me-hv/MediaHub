import { prisma } from '../config/prisma';
import { CryptoUtils } from '@mediahub/utils';
import { ApiScope, ApiKeyItemData } from '@mediahub/types';
import { logger } from '../utils/logger';

export class ApiKeyService {
  static async createApiKey(userId: string, name: string, scopes?: ApiScope[]): Promise<ApiKeyItemData> {
    const { secretKey, keyPrefix, keyHash } = CryptoUtils.generateApiKey();
    const assignedScopes = scopes && scopes.length > 0 ? scopes : ['media.read', 'media.download'];

    try {
      const apiKey = await prisma.apiKey.create({
        data: {
          userId,
          name,
          keyPrefix,
          keyHash,
          scopes: assignedScopes,
          status: 'ACTIVE',
        },
      });

      logger.info({ userId, apiKeyId: apiKey.id }, 'API Key generated');

      return {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        secretKey, // Plaintext returned ONLY ONCE upon creation
        scopes: apiKey.scopes as ApiScope[],
        status: 'ACTIVE',
        createdAt: apiKey.createdAt.toISOString(),
      };
    } catch (err: any) {
      logger.error({ error: err.message, userId }, 'Failed to create API key');
      throw err;
    }
  }

  static async listApiKeys(userId: string): Promise<ApiKeyItemData[]> {
    try {
      const keys = await prisma.apiKey.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return keys.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        scopes: k.scopes as ApiScope[],
        status: k.status,
        lastUsedAt: k.lastUsedAt?.toISOString(),
        createdAt: k.createdAt.toISOString(),
      }));
    } catch {
      return [];
    }
  }

  static async revokeApiKey(id: string, userId: string): Promise<boolean> {
    try {
      const res = await prisma.apiKey.updateMany({
        where: { id, userId },
        data: { status: 'REVOKED' },
      });
      return res.count > 0;
    } catch {
      return false;
    }
  }

  static async validateApiKey(rawSecretKey: string) {
    const keyHash = CryptoUtils.hashKey(rawSecretKey);
    try {
      const key = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: { user: true },
      });

      if (!key || key.status !== 'ACTIVE') return null;
      if (key.expiresAt && key.expiresAt < new Date()) return null;

      // Async update lastUsedAt
      prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

      return key;
    } catch {
      return null;
    }
  }
}
