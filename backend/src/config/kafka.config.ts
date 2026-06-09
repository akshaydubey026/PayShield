import { Consumer, Kafka, logLevel, Producer } from "kafkajs";

const isProduction = process.env.NODE_ENV === "production";
const brokerUrl = process.env.KAFKA_BROKER;

// Disable Kafka in production if no broker is explicitly configured or if it points to localhost.
// Render production services don't have Kafka on localhost.
export const isKafkaEnabled =
  process.env.DISABLE_KAFKA !== "true" &&
  !(isProduction && (!brokerUrl || brokerUrl.includes("localhost") || brokerUrl.includes("127.0.0.1")));

const kafka = new Kafka({
  clientId: "payshield-backend",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
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
