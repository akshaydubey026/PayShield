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
 * Creates a Stripe Checkout Session for a donation.
 *
 * @param amount - The donation amount in the base unit (e.g., rupees, dollars)
 * @param currency - The ISO 4217 currency code (e.g., "inr", "usd")
 * @param donationId - The internal Donation record ID (used as client_reference_id)
 * @param campaignTitle - The campaign title shown to the donor on Stripe
 * @param campaignId - The campaign ID used to build success/cancel redirect URLs
 * @returns The full Stripe.Checkout.Session object (session.id and session.url are available)
 */
export async function createCheckoutSession(
  amount: number,
  currency: string,
  donationId: string,
  campaignTitle: string,
  campaignId: string
): Promise<any> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Donation to ${campaignTitle}`,
            description: `Thank you for supporting ${campaignTitle}!`,
          },
          unit_amount: Math.round(amount * 100), // Stripe expects smallest currency unit (paise/cents)
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${env.FRONTEND_ORIGIN}/campaigns/${campaignId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_ORIGIN}/campaigns/${campaignId}?payment=cancel`,
    client_reference_id: donationId,
  });

  return session;
}

/**
 * Verifies a Stripe Checkout Session by session ID.
 * Returns whether the payment was successful and the payment intent ID.
 */
export async function verifyPayment(sessionId: string): Promise<{
  isValid: boolean;
  paymentIntentId: string | undefined;
}> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return {
    isValid: session.payment_status === "paid",
    paymentIntentId: session.payment_intent as string | undefined,
  };
}
