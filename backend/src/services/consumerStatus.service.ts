export type ServiceStatus = "running" | "stopped";

type ConsumerStatus = {
  notificationService: ServiceStatus;
  auditLogger: ServiceStatus;
  fraudAnalytics: ServiceStatus;
};

const status: ConsumerStatus = {
  notificationService: "stopped",
  auditLogger: "stopped",
  fraudAnalytics: "stopped",
};

export function markConsumerStatus(
  consumer: keyof ConsumerStatus,
  state: ServiceStatus
) {
  status[consumer] = state;
}

export function getConsumerStatus(): ConsumerStatus {
  return { ...status };
}
