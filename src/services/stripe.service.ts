import Stripe from "stripe";
import { env } from "../config/env.js";

if (!env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
  throw new Error(
    "Missing or invalid STRIPE_SECRET_KEY. Set a real Stripe secret key in your .env file."
  );
}

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia" as any,
});

/**
 * Creates a new Stripe Checkout Session for each donation attempt (sessions are single-use).
 */
export async function createCheckoutSession(
  amount: number,
  currency: string,
  donationId: string,
  campaignTitle: string,
  campaignId: string,
  customerEmail: string,
  userId: string
): Promise<any> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: campaignTitle,
            description: `Donation to ${campaignTitle} via PayShield`,
            images: [],
          },
          unit_amount: Math.round(Number(amount) * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${env.FRONTEND_ORIGIN}/campaigns/${campaignId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_ORIGIN}/campaigns/${campaignId}?payment=cancelled`,
    client_reference_id: donationId,
    customer_email: customerEmail,
    metadata: {
      donationId,
      userId,
      campaignId,
    },
  });

  return session;
}
