import type { Response, Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.middleware.js";
import * as stripeService from "../services/stripe.service.js";
import { env } from "../config/env.js";

// ─────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────

const createOrderSchema = z.object({
  campaignId: z.string().min(1, "campaignId is required"),
  amount: z.number().positive("amount must be a positive number"),
  currency: z.string().default("inr"),
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

    // 4. Create Stripe Checkout Session
    const session = await stripeService.createCheckoutSession(
      amount,
      currency,
      donation.id,
      campaign.title,
      campaign.id
    );

    // 5. Persist the Stripe session ID on the donation record
    await prisma.donation.update({
      where: { id: donation.id },
      data: { stripeSessionId: session.id },
    });

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
    // 1. Check payment status with Stripe
    const { isValid, paymentIntentId } = await stripeService.verifyPayment(sessionId);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Payment not successful" });
    }

    // 2. Find the donation by Stripe session ID
    const donation = await prisma.donation.findFirst({
      where: { stripeSessionId: sessionId },
    });

    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found" });
    }

    // 3. Idempotency: skip if already verified
    if (donation.status === "SUCCESS") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        status: "SUCCESS",
      });
    }

    // 4. Mark donation as SUCCESS and save payment intent ID
    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: "SUCCESS",
        stripePaymentIntentId: paymentIntentId,
      },
    });

    // 5. Increment campaign raised amount
    await prisma.campaign.update({
      where: { id: donation.campaignId },
      data: { raisedAmount: { increment: donation.amount } },
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      status: "SUCCESS",
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
      where: { donorId: req.user.id },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        stripeSessionId: true,
        campaign: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, donations });
  } catch (e: any) {
    console.error("[myDonations] Error:", e);
    return res.status(500).json({
      success: false,
      message: e?.message ?? "Failed to fetch donations",
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
