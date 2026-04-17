/** Shared TanStack Query keys — keep in sync across dashboard pages for cache reuse. */
export const queryKeys = {
  fraudStats: ["fraud", "stats"] as const,
  fraudFeed: ["fraud", "feed"] as const,
  kafkaStats: ["kafka", "stats"] as const,
  kafkaAuditLogs: (limit: number) => ["kafka", "audit-logs", limit] as const,
  campaigns: ["campaigns"] as const,
};
