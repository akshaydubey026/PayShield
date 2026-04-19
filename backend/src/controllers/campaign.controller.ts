import type { Response, Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.middleware.js";

const createCampaignSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(50),
  goalAmount: z.coerce.number().min(1000),
  category: z.enum(["Education", "Health", "Environment", "Relief", "Elderly"]),
  imageUrl: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
});

export async function getMyCampaigns(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const campaigns = await prisma.campaign.findMany({
      where: { creatorId: req.user.id },
      include: {
        _count: { select: { donations: { where: { status: "SUCCESS" } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = campaigns.map((c) => {
      const progressPercent =
        c.goalAmount > 0 ? Math.min(100, (c.raisedAmount / c.goalAmount) * 100) : 0;
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        goalAmount: c.goalAmount,
        raisedAmount: c.raisedAmount,
        category: c.category,
        imageUrl: c.imageUrl,
        isActive: c.isActive,
        createdAt: c.createdAt,
        totalRaised: c.raisedAmount,
        donationCount: c._count.donations,
        progressPercent,
      };
    });

    return res.json({ campaigns: enriched });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to fetch your campaigns" });
  }
}

export async function getAll(req: Request, res: Response) {
  try {
    const [campaigns, blockedByCampaign] = await Promise.all([
      prisma.campaign.findMany({
        where: { isActive: true },
        include: {
          creator: { select: { name: true } },
          _count: { select: { donations: { where: { status: "SUCCESS" } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.donation.groupBy({
        by: ["campaignId"],
        where: { status: "BLOCKED" },
        _count: { _all: true },
      }),
    ]);

    const blockedCampaignIds = new Set(blockedByCampaign.map((b) => b.campaignId));

    return res.json(
      campaigns.map((c) => ({
        ...c,
        hasBlockedDonations: blockedCampaignIds.has(c.id),
      }))
    );
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to fetch campaigns" });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { name: true, email: true } },
        donations: {
          where: { status: "SUCCESS" },
          include: { donor: { select: { name: true } } },
          orderBy: { createdAt: "desc" }
        },
        _count: { select: { donations: { where: { status: "SUCCESS" } } } }
      },
    });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    return res.json(campaign);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to fetch campaign" });
  }
}

export async function create(req: AuthedRequest, res: Response) {
  if (!req.user || !["ADMIN", "CREATOR"].includes(req.user.role)) {
    return res.status(403).json({ error: "Only admins and creators can create campaigns" });
  }

  const parsed = createCampaignSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Validation failed";
    return res.status(400).json({ error: first });
  }

  try {
    const campaign = await prisma.campaign.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        goalAmount: parsed.data.goalAmount,
        category: parsed.data.category,
        imageUrl: parsed.data.imageUrl ?? null,
        creatorId: req.user.id,
        isActive: true,
      },
      include: { creator: { select: { id: true, name: true, email: true } } },
    });
    return res.status(201).json({ campaign });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to create campaign" });
  }
}

export async function update(req: AuthedRequest, res: Response) {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    
    if (campaign.creatorId !== req.user?.id && req.user?.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await prisma.campaign.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to update campaign" });
  }
}
