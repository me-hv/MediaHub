import crypto from 'crypto';

export class CryptoUtils {
  static hashKey(secretKey: string): string {
    return crypto.createHash('sha256').update(secretKey).digest('hex');
  }

  static generateApiKey(): { secretKey: string; keyPrefix: string; keyHash: string } {
    const rawSecret = crypto.randomBytes(24).toString('hex');
    const secretKey = `mh_live_${rawSecret}`;
    const keyPrefix = secretKey.slice(0, 12); // e.g. "mh_live_a1b2"
    const keyHash = this.hashKey(secretKey);
    return { secretKey, keyPrefix, keyHash };
  }

  static generateWebhookSecret(): { secretKey: string; secretPrefix: string; secretHash: string } {
    const rawSecret = crypto.randomBytes(24).toString('hex');
    const secretKey = `whsec_${rawSecret}`;
    const secretPrefix = secretKey.slice(0, 10);
    const secretHash = this.hashKey(secretKey);
    return { secretKey, secretPrefix, secretHash };
  }

  static signWebhookPayload(payload: string, secretKey: string): string {
    return crypto.createHmac('sha256', secretKey).update(payload).digest('hex');
  }

  static verifyWebhookSignature(payload: string, signature: string, secretKey: string): boolean {
    const expected = this.signWebhookPayload(payload, secretKey);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}
