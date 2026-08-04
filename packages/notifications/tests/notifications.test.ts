import { describe, it, expect } from 'vitest';
import { NotificationService } from '../src/NotificationService';

describe('NotificationService', () => {
  it('should send email successfully', async () => {
    const res = await NotificationService.sendEmail({
      to: 'admin@acme.com',
      subject: 'Welcome',
      body: 'Hello',
    });

    expect(res.success).toBe(true);
    expect(res.messageId).toContain('msg_');
  });

  it('should send quota warning notification', async () => {
    const res = await NotificationService.sendQuotaWarning('admin@acme.com', 800, 1000);
    expect(res.success).toBe(true);
  });
});
