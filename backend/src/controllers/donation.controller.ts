import type { Response, Request } from "express";
import type { DonationStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.middleware.js";
import * as stripeService from "../services/stripe.service.js";
import { env } from "../config/env.js";
import redis from "../config/redis.config.js";
import {
  publishDonationCreated,
  publishDonationProcessed,
  publishFraudFlagged,
} from "../services/kafka.service.js";

// ─────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────

/** Stripe requires the charge to convert to at least ~$0.50 USD; ₹1 is rejected. */
const MIN_DONATION_INR = 50;
const MIN_DONATION_USD = 0.5;

const createOrderSchema = z
  .object({
    campaignId: z.string().min(1, "campaignId is required"),
    amount: z.number().positive("amount must be a positive number"),
    currency: z.string().default("inr"),
  })
  .superRefine((data, ctx) => {
    const c = data.currency.toLowerCase();
    if (c === "inr" && data.amount < MIN_DONATION_INR) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Minimum donation is ₹${MIN_DONATION_INR} for card checkout (Stripe).`,
        path: ["amount"],
      });
    } else if (c === "usd" && data.amount < MIN_DONATION_USD) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Minimum donation is $${MIN_DONATION_USD} for card checkout (Stripe).`,
        path: ["amount"],
      });
    }
  });

const verifySchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
});

// ─────────────────────────────────────────────
// POST /api/donations/create-order
// ─────────────────────────────────────────────

export async function createOrder(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      issues: parsed.error.flatten(),
    });
  }

  const { campaignId, amount, currency } = parsed.data;

  try {
    // 1. Verify the campaign exists
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    // 2. Read fraud result attached by fraudCheckMiddleware (if it ran)
    const fraudResult = (req as any).fraudResult;

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existingPending = await prisma.donation.findFirst({
      where: {
        donorId: req.user.id,
        campaignId,
        status: "PENDING",
        createdAt: { gte: thirtyMinutesAgo },
      },
    });

    if (existingPending) {
      await prisma.donation.update({
        where: { id: existingPending.id },
        data: { status: "FAILED" },
      });
    }

    // 3. Create the Donation record in PENDING state
    const donation = await prisma.donation.create({
      data: {
        amount,
        donorId: req.user.id,
        campaignId,
        status: "PENDING",
        riskScore: fraudResult?.riskScore ?? 0,
        isFlagged: fraudResult?.isFlagged ?? false,
        fraudFlags: fraudResult?.fraudFlags ?? [],
        fraudReasons: fraudResult?.fraudReasons ?? [],
      },
    });

    // 4. Create a new Stripe Checkout Session (each attempt must use a fresh session)
    const session = await stripeService.createCheckoutSession(
      amount,
      currency,
      donation.id,
      campaign.title,
      campaign.id,
      req.user.email,
      req.user.id
    );

    // 5. Persist the Stripe session ID on the donation record
    const updatedDonation = await prisma.donation.update({
      where: { id: donation.id },
      data: { stripeSessionId: session.id },
    });

    try {
      await publishDonationCreated({
        donationId: updatedDonation.id,
        userId: req.user.id,
        campaignId,
        amount: Number(amount),
        stripeSessionId: session.id,
        riskScore: fraudResult?.riskScore || 0,
        flags: fraudResult?.fraudFlags || [],
        userEmail: req.user.email,
        userName: req.user.email.split("@")[0] || "Donor",
        campaignTitle: campaign.title,
      });

      if (fraudResult?.decision === "REVIEW") {
        await publishFraudFlagged({
          donationId: updatedDonation.id,
          userId: req.user.id,
          amount: Number(amount),
          riskScore: fraudResult.riskScore,
          flags: fraudResult.fraudFlags,
          signals: fraudResult.signals,
          ipAddress: req.ip || "",
        });
      }
    } catch (kafkaErr) {
      console.error("[createOrder] Kafka publish skipped:", kafkaErr);
    }

    // 6. Return success with the Stripe checkout URL
    return res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (e: any) {
    console.error("[createOrder] Error:", e);
    return res.status(500).json({
      success: false,
      message: e?.message ?? "Failed to create order. Please try again.",
    });
  }
}

// ─────────────────────────────────────────────
// POST /api/donations/verify
// ─────────────────────────────────────────────

export async function verify(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      issues: parsed.error.flatten(),
    });
  }

  const { sessionId } = parsed.data;

  try {
    const donation = await prisma.donation.findFirst({
      where: { stripeSessionId: sessionId },
    });

    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found" });
    }

    if (donation.donorId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (donation.status === "SUCCESS") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        status: "SUCCESS",
        alreadyProcessed: true,
        donation: {
          id: donation.id,
          amount: donation.amount,
          campaignId: donation.campaignId,
          status: donation.status,
        },
      });
    }

    if (donation.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        error: "Cannot verify donation with status: " + donation.status,
        message: "Cannot verify donation with status: " + donation.status,
      });
    }

    const session = await stripeService.stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: "FAILED" },
      });
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }

    const paymentIntentRaw = session.payment_intent;
    const paymentIntentId =
      typeof paymentIntentRaw === "string"
        ? paymentIntentRaw
        : paymentIntentRaw && typeof paymentIntentRaw === "object" && "id" in paymentIntentRaw
          ? (paymentIntentRaw as { id: string }).id
          : undefined;

    const updatedDonation = await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: "SUCCESS",
        stripePaymentIntentId: paymentIntentId,
      },
    });

    const updatedCampaign = await prisma.campaign.update({
      where: { id: donation.campaignId },
      data: { raisedAmount: { increment: donation.amount } },
    });

    const dupKey = `campaign_donate:${donation.donorId}:${donation.campaignId}`;
    try {
      await redis.set(dupKey, "1", "EX", 86400);
    } catch {
      /* non-fatal */
    }

    const donationWithRelations = await prisma.donation.findUnique({
      where: { id: updatedDonation.id },
      include: {
        donor: { select: { email: true, name: true } },
        campaign: { select: { title: true } },
      },
    });

    if (donationWithRelations) {
      try {
        await publishDonationProcessed({
          donationId: donationWithRelations.id,
          userId: donationWithRelations.donorId,
          campaignId: donationWithRelations.campaignId,
          amount: donationWithRelations.amount,
          stripePaymentIntentId: paymentIntentId || "",
          userEmail: donationWithRelations.donor.email,
          userName: donationWithRelations.donor.name,
          campaignTitle: donationWithRelations.campaign.title,
          newRaisedAmount: updatedCampaign.raisedAmount,
        });
      } catch (kafkaErr) {
        console.error("[verify] Kafka publish skipped:", kafkaErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      status: "SUCCESS",
      alreadyProcessed: false,
      donation: {
        id: updatedDonation.id,
        amount: updatedDonation.amount,
        campaignId: updatedDonation.campaignId,
        status: updatedDonation.status,
      },
    });
  } catch (e: any) {
    console.error("[verify] Error:", e);
    return res.status(500).json({
      success: false,
      message: e?.message ?? "Verification failed. Please try again.",
    });
  }
}

// ─────────────────────────────────────────────
// POST /api/donations/webhook  (Stripe Webhook)
// ─────────────────────────────────────────────

export async function stripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;

  if (!sig) {
    return res.status(400).json({ message: "Missing stripe-signature header" });
  }

  let event: any;

  try {
    // req.body must be the raw Buffer — this route uses express.raw() NOT express.json()
    event = stripeService.stripe.webhooks.constructEvent(
      req.body,
      sig,
      env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch (err: any) {
    console.error(`[Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    console.log(`[Webhook] Received event type: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log(`[Webhook] checkout.session.completed session=${session.id}`);

      const donation = await prisma.donation.findFirst({
        where: { stripeSessionId: session.id },
      });

      if (!donation) {
        console.log(`[Webhook] No donation found for session ${session.id}`);
        return res.status(200).json({ received: true, matched: false });
      }

      // Idempotency: do not increment campaign twice.
      if (donation.status === "SUCCESS") {
        console.log(`[Webhook] Donation ${donation.id} already SUCCESS, skipping increment`);
        return res.status(200).json({ received: true, matched: true, alreadyProcessed: true });
      }

      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: "SUCCESS",
          stripePaymentIntentId: session.payment_intent as string,
        },
      });

      await prisma.campaign.update({
        where: { id: donation.campaignId },
        data: {
          raisedAmount: { increment: donation.amount },
        },
      });

      console.log(
        `[Webhook] Marked donation=${donation.id} SUCCESS and incremented campaign=${donation.campaignId} by ${donation.amount}`
      );
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      console.log(`[Webhook] checkout.session.expired session=${session.id}`);

      const donation = await prisma.donation.findFirst({
        where: { stripeSessionId: session.id },
      });

      if (!donation) {
        console.log(`[Webhook] No donation found for expired session ${session.id}`);
        return res.status(200).json({ received: true, matched: false });
      }

      if (donation.status === "SUCCESS") {
        console.log(`[Webhook] Donation ${donation.id} already SUCCESS, not marking FAILED`);
        return res.status(200).json({ received: true, matched: true, alreadyProcessed: true });
      }

      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: "FAILED" },
      });

      console.log(`[Webhook] Marked donation=${donation.id} as FAILED (expired session)`);
    }
  } catch (e: any) {
    console.error("[Webhook] Handler error:", e);
    // Return 200 so Stripe doesn't retry — log the error internally
  }

  return res.status(200).json({ received: true });
}

// ─────────────────────────────────────────────
// GET /api/donations/my
// ─────────────────────────────────────────────

export async function myDonations(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const donations = await prisma.donation.findMany({
      where: {
        donorId: req.user.id,
        status: { in: ["SUCCESS", "BLOCKED"] },
        source: { not: "simulation" },
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        campaign: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ donations });
  } catch (e: any) {
    console.error("[myDonations] Error:", e);
    return res.status(500).json({
      success: false,
      message: e?.message ?? "Failed to fetch donations",
    });
  }
}

// ─────────────────────────────────────────────
// GET /api/donations/all (admin only)
// ─────────────────────────────────────────────

const DONATION_STATUSES: DonationStatus[] = ["PENDING", "SUCCESS", "FAILED", "BLOCKED"];

export async function getAllDonations(req: AuthedRequest, res: Response) {
  try {
    const statusParam = typeof req.query.status === "string" ? req.query.status : undefined;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "50"), 10) || 50, 1), 2000);
    const offset = Math.max(parseInt(String(req.query.offset ?? "0"), 10) || 0, 0);

    const where: { status?: DonationStatus } = {};
    if (statusParam && DONATION_STATUSES.includes(statusParam as DonationStatus)) {
      where.status = statusParam as DonationStatus;
    }

    const donations = await prisma.donation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        amount: true,
        status: true,
        riskScore: true,
        fraudFlags: true,
        createdAt: true,
        campaignId: true,
        donor: { select: { name: true, email: true } },
        campaign: { select: { title: true } },
      },
    });

    return res.status(200).json(donations);
  } catch (e: unknown) {
    console.error("[getAllDonations] Error:", e);
    return res.status(500).json({
      success: false,
      message: e instanceof Error ? e.message : "Failed to fetch donations",
    });
  }
}

// ─────────────────────────────────────────────
// GET /api/donations/campaign/:id
// ─────────────────────────────────────────────

export async function campaignDonations(req: Request, res: Response) {
  try {
    const donations = await prisma.donation.findMany({
      where: { campaignId: req.params.id, status: "SUCCESS" },
      include: { donor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(donations);
  } catch (e: any) {
    console.error("[campaignDonations] Error:", e);
    return res.status(500).json({
      success: false,
      message: e?.message ?? "Failed to fetch campaign donations",
    });
  }
}
