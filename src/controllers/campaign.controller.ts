import type { Response, Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.middleware.js";

const createCampaignSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  goalAmount: z.number().positive(),
  imageUrl: z.string().url().optional(),
  category: z.string(),
});

export async function getAll(req: Request, res: Response) {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { isActive: true },
      include: {
        creator: { select: { name: true } },
        _count: { select: { donations: { where: { status: "SUCCESS" } } } }
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(campaigns);
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
  if (req.user?.role !== "CREATOR" && req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Only creators can create campaigns" });
  }

  const parsed = createCampaignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", issues: parsed.error.flatten() });
  }

  try {
    const campaign = await prisma.campaign.create({
      data: {
        ...parsed.data,
        creatorId: req.user.id,
      },
    });
    return res.status(201).json(campaign);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to create campaign" });
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
