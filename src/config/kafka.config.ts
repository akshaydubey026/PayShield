import { Consumer, Kafka, logLevel, Producer } from "kafkajs";

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
