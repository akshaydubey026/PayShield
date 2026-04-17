import redis from "../config/redis.config.js";
import { createConsumer } from "../config/kafka.config.js";
import { TOPICS } from "../config/topics.config.js";
import { markConsumerStatus } from "../services/consumerStatus.service.js";

const consumer = createConsumer("fraud-analytics-service");

export async function startFraudAnalyticsConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topic: TOPICS.FRAUD_FLAGGED,
    fromBeginning: false,
  });
  await consumer.subscribe({
    topic: TOPICS.FRAUD_BLOCKED,
    fromBeginning: false,
  });

  markConsumerStatus("fraudAnalytics", "running");
  console.log("✅ Fraud analytics consumer started");

  consumer
    .run({
      eachMessage: async ({ topic, message }) => {
        const data = JSON.parse(message.value?.toString() || "{}");
        const today = new Date().toISOString().split("T")[0];

        if (topic === TOPICS.FRAUD_BLOCKED) {
          await redis.incr(`stats:blocked:${today}`);
          await redis.expire(`stats:blocked:${today}`, 86400 * 7);

          for (const flag of data.flags || []) {
            await redis.incr(`stats:flag:${flag}:${today}`);
            await redis.expire(`stats:flag:${flag}:${today}`, 86400 * 7);
          }

          await redis.incrbyfloat(
            `stats:blocked_amount:${today}`,
            Number(data.amount || 0)
          );
        }

        if (topic === TOPICS.FRAUD_FLAGGED) {
          await redis.incr(`stats:reviewed:${today}`);
          await redis.expire(`stats:reviewed:${today}`, 86400 * 7);
        }

        console.log(`📊 Fraud analytics updated -> ${topic}`);
      },
    })
    .catch((err) => {
      markConsumerStatus("fraudAnalytics", "stopped");
      console.error("Fraud analytics consumer crashed:", err);
    });
}
