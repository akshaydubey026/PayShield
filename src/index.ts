import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import donationRoutes from "./routes/donation.routes.js";
import fraudRoutes from "./routes/fraud.routes.js";
import kafkaRouter from "./routes/kafka.routes.js";
import { requireAuth } from "./middleware/auth.middleware.js";
import { stripeWebhook } from "./controllers/donation.controller.js";
import { connectProducer } from "./services/kafka.service.js";
import { startNotificationConsumer } from "./consumers/notification.consumer.js";
import { startAuditLoggerConsumer } from "./consumers/auditLogger.consumer.js";
import { startFraudAnalyticsConsumer } from "./consumers/fraudAnalytics.consumer.js";

const app = express();

// ─────────────────────────────────────────────
// CORS — Allow frontend origin with credentials
// ─────────────────────────────────────────────
app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  })
);

// ─────────────────────────────────────────────
// STRIPE WEBHOOK — MUST be mounted BEFORE express.json()
// Stripe requires the raw request body (Buffer) for signature verification.
// Mounting after express.json() would parse it into an object and break constructEvent().
// ─────────────────────────────────────────────
app.post(
  "/api/donations/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// ─────────────────────────────────────────────
// Body Parsers — mounted AFTER the webhook route
// ─────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/fraud", requireAuth, fraudRoutes);
app.use("/api/kafka", requireAuth, kafkaRouter);

// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[GlobalErrorHandler]", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
);

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
async function startKafkaServices() {
  try {
    await connectProducer();
    await startNotificationConsumer();
    await startAuditLoggerConsumer();
    await startFraudAnalyticsConsumer();
    console.log("✅ All Kafka consumers running");
  } catch (err) {
    console.error("❌ Kafka startup failed:", err);
    console.log("⚠️  App running without Kafka — check Docker");
  }
}

app.listen(env.PORT, () => {
  console.log(`PayShield API listening on http://localhost:${env.PORT}`);
  void startKafkaServices();
});
