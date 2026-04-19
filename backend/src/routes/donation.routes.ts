import { Router } from "express";
import { adminOnly, requireAuth } from "../middleware/auth.middleware.js";
import * as donationController from "../controllers/donation.controller.js";
import { fraudCheckMiddleware } from "../middleware/fraudCheck.middleware.js";

const router = Router();

// POST /api/donations/create-order
// Requires authentication + fraud check before creating order
router.post(
  "/create-order",
  requireAuth,
  fraudCheckMiddleware,
  donationController.createOrder
);

// POST /api/donations/verify
// Called by the frontend after returning from Stripe to confirm payment
router.post("/verify", requireAuth, donationController.verify);

// GET /api/donations/my
// Returns the logged-in user's donation history
router.get("/my", requireAuth, donationController.myDonations);
router.get("/my-donations", requireAuth, donationController.myDonations);

// GET /api/donations/all — admin only; query: ?status=&limit=&offset=
router.get("/all", requireAuth, adminOnly, donationController.getAllDonations);

// GET /api/donations/campaign/:id
// Returns all successful donations for a given campaign (public)
router.get("/campaign/:id", donationController.campaignDonations);

// NOTE: The /webhook route is NOT mounted here.
// It is mounted directly in index.ts BEFORE express.json()
// so that the request body is available as a raw Buffer for signature verification.

export default router;
