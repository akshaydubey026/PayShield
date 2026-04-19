import { Router } from "express";
import kafka from "../config/kafka.config.js";
import redis, { isRedisReady } from "../config/redis.config.js";
import { prisma } from "../lib/prisma.js";
import { getConsumerStatus } from "../services/consumerStatus.service.js";

const kafkaRouter = Router();

kafkaRouter.get("/stats", async (_req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    if (!isRedisReady()) {
      return res.json({
        today: { blocked: 0, reviewed: 0, blockedAmount: 0 },
        topFlags: [],
        consumerStatus: getConsumerStatus(),
      });
    }
    const [blocked, reviewed, blockedAmount, keys] = await Promise.all([
      redis.get(`stats:blocked:${today}`),
      redis.get(`stats:reviewed:${today}`),
      redis.get(`stats:blocked_amount:${today}`),
      redis.keys(`stats:flag:*:${today}`),
    ]);

    const flagCounts = await Promise.all(
      keys.map(async (key) => {
        const count = await redis.get(key);
        const [, , flag] = key.split(":");
        return {
          flag,
          label: flag.replaceAll("_", " "),
          count: parseInt(count || "0", 10),
        };
      })
    );

    const topFlags = flagCounts.sort((a, b) => b.count - a.count).slice(0, 5);

    return res.json({
      today: {
        blocked: parseInt(blocked || "0", 10),
        reviewed: parseInt(reviewed || "0", 10),
        blockedAmount: parseFloat(blockedAmount || "0"),
      },
      topFlags,
      consumerStatus: getConsumerStatus(),
    });
  } catch (err) {
    console.error("Kafka stats error:", err);
    return res.status(500).json({ message: "Failed to fetch kafka stats" });
  }
});

kafkaRouter.get("/audit-logs", async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || "20"), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset || "0"), 10), 0);
    const topic = req.query.topic ? String(req.query.topic) : undefined;

    const logs = await prisma.auditLog.findMany({
      where: topic ? { topic } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.auditLog.count({
      where: topic ? { topic } : undefined,
    });

    return res.json({ data: logs, total, limit, offset });
  } catch (err) {
    console.error("Kafka audit logs error:", err);
    return res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

kafkaRouter.get("/health", async (_req, res) => {
  const groupIds = [
    "notification-service",
    "audit-logger-service",
    "fraud-analytics-service",
  ];

  const admin = kafka.admin();
  try {
    await admin.connect();
    const groups = await admin.describeGroups(groupIds);
    const byGroup = groups.groups.reduce<Record<string, "running" | "stopped">>(
      (acc, group) => {
        acc[group.groupId] = group.members.length > 0 ? "running" : "stopped";
        return acc;
      },
      {}
    );

    return res.json({
      kafka: "running",
      groups: byGroup,
      consumerStatus: getConsumerStatus(),
    });
  } catch (err) {
    console.error("Kafka health error:", err);
    return res.status(500).json({
      kafka: "stopped",
      message: "Kafka unavailable",
      consumerStatus: getConsumerStatus(),
    });
  } finally {
    await admin.disconnect().catch(() => undefined);
  }
});

export default kafkaRouter;
