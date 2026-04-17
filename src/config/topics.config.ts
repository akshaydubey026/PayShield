export const TOPICS = {
  DONATION_CREATED: "donation.created",
  DONATION_PROCESSED: "donation.processed",
  DONATION_FAILED: "donation.failed",
  FRAUD_FLAGGED: "fraud.flagged",
  FRAUD_BLOCKED: "fraud.blocked",
  NOTIFICATION_EMAIL: "notification.email",
  AUDIT_LOG: "audit.log",
} as const;

export const ALL_TOPICS = Object.values(TOPICS);
