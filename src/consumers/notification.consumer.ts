import nodemailer from "nodemailer";
import { createConsumer } from "../config/kafka.config.js";
import { TOPICS } from "../config/topics.config.js";
import { markConsumerStatus } from "../services/consumerStatus.service.js";

const consumer = createConsumer("notification-service");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function startNotificationConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topic: TOPICS.DONATION_PROCESSED,
    fromBeginning: false,
  });
  await consumer.subscribe({
    topic: TOPICS.FRAUD_FLAGGED,
    fromBeginning: false,
  });

  markConsumerStatus("notificationService", "running");
  console.log("✅ Notification consumer started");

  consumer
    .run({
      eachMessage: async ({ topic, message }) => {
        const data = JSON.parse(message.value?.toString() || "{}");

        if (topic === TOPICS.DONATION_PROCESSED) {
          await sendDonationSuccessEmail(data);
        }

        if (topic === TOPICS.FRAUD_FLAGGED) {
          await sendFraudAlertEmail(data);
        }
      },
    })
    .catch((err) => {
      markConsumerStatus("notificationService", "stopped");
      console.error("Notification consumer crashed:", err);
    });
}

async function sendDonationSuccessEmail(data: {
  userEmail: string;
  userName: string;
  campaignTitle: string;
  amount: number;
  donationId: string;
}) {
  const mailOptions = {
    from: '"PayShield" <noreply@payshield.com>',
    to: data.userEmail,
    subject: `Thank you for your donation to ${data.campaignTitle}! 💙`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;
                  margin: 0 auto; background: #0A0F1E; color: white;
                  padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #3B82F6; margin: 0;">PayShield</h1>
          <p style="color: #6B7280; font-size: 14px;">
            Secure Donation Platform
          </p>
        </div>
        <h2 style="color: white;">
          Thank you, ${data.userName}! 🎉
        </h2>
        <p style="color: #D1D5DB;">
          Your donation of
          <strong style="color: #10B981;">
            ₹${data.amount.toLocaleString("en-IN")}
          </strong>
          to <strong>${data.campaignTitle}</strong>
          has been received and verified.
        </p>
        <div style="background: #1F2937; border-radius: 8px;
                    padding: 16px; margin: 24px 0;">
          <p style="margin: 0; color: #9CA3AF; font-size: 13px;">
            Transaction ID
          </p>
          <p style="margin: 4px 0 0; color: white; font-family: monospace;">
            ${data.donationId}
          </p>
        </div>
        <div style="background: #064E3B; border-radius: 8px;
                    padding: 12px 16px; margin: 16px 0;">
          <p style="margin: 0; color: #6EE7B7; font-size: 13px;">
            ✅ This transaction was verified and protected by
            PayShield fraud detection
          </p>
        </div>
        <p style="color: #6B7280; font-size: 12px; text-align: center;">
          PayShield — Every rupee protected
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    console.log(`Preview: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (err) {
    console.error("Email send failed:", err);
  }
}

async function sendFraudAlertEmail(data: any) {
  const mailOptions = {
    from: '"PayShield Alerts" <alerts@payshield.com>',
    to: process.env.ADMIN_EMAIL || "admin@payshield.com",
    subject: `⚠️ Fraud Review Required — Risk Score: ${data.riskScore}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h2 style="color: #F59E0B;">Fraud Review Alert</h2>
        <p>A transaction requires manual review.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; color: #6B7280;">User ID</td>
            <td style="padding: 8px;">${data.userId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #6B7280;">Amount</td>
            <td style="padding: 8px;">₹${data.amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #6B7280;">Risk Score</td>
            <td style="padding: 8px; color: #EF4444; font-weight: bold;">
              ${data.riskScore}/100
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #6B7280;">Flags</td>
            <td style="padding: 8px;">${data.flags?.join(", ")}</td>
          </tr>
        </table>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
