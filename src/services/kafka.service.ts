import { producer } from "../config/kafka.config.js";
import { TOPICS } from "../config/topics.config.js";

let isProducerConnected = false;

export async function connectProducer() {
  if (!isProducerConnected) {
    await producer.connect();
    isProducerConnected = true;
    console.log("✅ Kafka producer connected");
  }
}

export async function publishEvent(
  topic: string,
  payload: Record<string, any>,
  key?: string
) {
  if (!isProducerConnected) await connectProducer();

  const message = {
    key: key || null,
    value: JSON.stringify({
      ...payload,
      _meta: {
        timestamp: new Date().toISOString(),
        topic,
        version: "1.0",
      },
    }),
  };

  await producer.send({ topic, messages: [message] });
  console.log(`📤 Event published -> ${topic}`, { key });

  if (topic !== TOPICS.AUDIT_LOG) {
    await producer.send({
      topic: TOPICS.AUDIT_LOG,
      messages: [
        {
          key: key || null,
          value: JSON.stringify({
            topic,
            payload,
            _meta: {
              timestamp: new Date().toISOString(),
              topic: TOPICS.AUDIT_LOG,
              version: "1.0",
            },
          }),
        },
      ],
    });
  }
}

export async function publishDonationCreated(donation: {
  donationId: string;
  userId: string;
  campaignId: string;
  amount: number;
  stripeSessionId: string;
  riskScore: number;
  flags: string[];
  userEmail: string;
  userName: string;
  campaignTitle: string;
}) {
  await publishEvent(TOPICS.DONATION_CREATED, donation, donation.donationId);
}

export async function publishDonationProcessed(data: {
  donationId: string;
  userId: string;
  campaignId: string;
  amount: number;
  stripePaymentIntentId: string;
  userEmail: string;
  userName: string;
  campaignTitle: string;
  newRaisedAmount: number;
}) {
  await publishEvent(TOPICS.DONATION_PROCESSED, data, data.donationId);
}

export async function publishFraudFlagged(data: {
  donationId: string;
  userId: string;
  amount: number;
  riskScore: number;
  flags: string[];
  signals: Record<string, number>;
  ipAddress: string;
}) {
  await publishEvent(TOPICS.FRAUD_FLAGGED, data, data.donationId);
}

export async function publishFraudBlocked(data: {
  userId: string;
  amount: number;
  campaignId: string;
  riskScore: number;
  flags: string[];
  ipAddress: string;
  blockedAt: string;
}) {
  await publishEvent(TOPICS.FRAUD_BLOCKED, data, data.userId);
}
