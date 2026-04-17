import { PrismaClient } from "@prisma/client";
import { createConsumer } from "../config/kafka.config.js";
import { ALL_TOPICS } from "../config/topics.config.js";
import { markConsumerStatus } from "../services/consumerStatus.service.js";

const prisma = new PrismaClient();
const consumer = createConsumer("audit-logger-service");

export async function startAuditLoggerConsumer() {
  await consumer.connect();
  for (const topic of ALL_TOPICS) {
    await consumer.subscribe({
      topic,
      fromBeginning: false,
    });
  }

  markConsumerStatus("auditLogger", "running");
  console.log("✅ Audit logger consumer started");

  consumer
    .run({
      eachMessage: async ({ topic, message }) => {
        try {
          const data = JSON.parse(message.value?.toString() || "{}");

          await prisma.auditLog.create({
            data: {
              topic,
              eventType: topic.replace(".", "_").toUpperCase(),
              payload: data,
              userId: data.userId || null,
              amount: data.amount || null,
              riskScore:
                typeof data.riskScore === "number"
                  ? Math.round(data.riskScore)
                  : null,
            },
          });

          console.log(`📝 Audit log saved -> ${topic}`);
        } catch (err) {
          console.error("Audit log failed:", err);
        }
      },
    })
    .catch((err) => {
      markConsumerStatus("auditLogger", "stopped");
      console.error("Audit logger consumer crashed:", err);
    });
}
