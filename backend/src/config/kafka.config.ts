import { Consumer, Kafka, logLevel, Producer } from "kafkajs";
import { env } from "./env.js";

const isProduction = env.NODE_ENV === "production";
const brokerUrl = env.KAFKA_BROKER;

// Disable Kafka if explicitly requested or in production when no remote broker is configured.
export const isKafkaEnabled =
  env.DISABLE_KAFKA !== "true" &&
  !(isProduction && (!brokerUrl || brokerUrl.includes("localhost") || brokerUrl.includes("127.0.0.1")));

const kafka = new Kafka({
  clientId: "payshield-backend",
  brokers: [env.KAFKA_BROKER],
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
});

export const producer: Producer = kafka.producer();
export const createConsumer = (groupId: string): Consumer =>
  kafka.consumer({ groupId });

export default kafka;
