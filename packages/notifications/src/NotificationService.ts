export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export class NotificationService {
  static async sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId: string }> {
    console.log(`[NotificationService Email] Sent email to ${payload.to}: ${payload.subject}`);
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
  }

  static async sendQuotaWarning(email: string, currentUsage: number, limit: number) {
    return this.sendEmail({
      to: email,
      subject: '⚠️ MediaHub Quota Warning: 80% limit reached',
      body: `Your organization has used ${currentUsage} of ${limit} monthly downloads.`,
    });
  }
}
