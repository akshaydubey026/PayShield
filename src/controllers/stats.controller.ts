import type { Response } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.middleware.js";

function donorImpactLabel(totalDonated: number): string {
  if (totalDonated >= 25_000) return "Gold";
  if (totalDonated >= 5_000) return "Silver";
  if (totalDonated >= 500) return "Bronze";
  return "Starter";
}

export async function donorSummary(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const userId = req.user.id;

  const donorLiveSuccessWhere = {
    donorId: userId,
    status: "SUCCESS" as const,
    source: { not: "simulation" },
  };

  try {
    const [donations, totalAmountResult] = await Promise.all([
      prisma.donation.findMany({
        where: donorLiveSuccessWhere,
        include: { campaign: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.donation.aggregate({
        where: donorLiveSuccessWhere,
        _sum: { amount: true },
      }),
    ]);

    res.setHeader("Cache-Control", "no-store, private");

    const totalDonated = totalAmountResult._sum.amount ?? 0;
    const uniqueCampaigns = new Set(donations.map((d) => d.campaignId)).size;
    const impactScore = donorImpactLabel(totalDonated);

    return res.json({
      totalDonated,
      campaignsSupported: uniqueCampaigns,
      totalDonations: donations.length,
      impactScore,
      recentDonations: donations.slice(0, 3).map((d) => ({
        id: d.id,
        amount: d.amount,
        createdAt: d.createdAt,
        campaign: d.campaign,
      })),
    });
  } catch (err) {
    console.error("[stats/donor-summary]", err);
    return res.status(500).json({ message: "Failed to load donor summary" });
  }
}

export async function overview(_req: AuthedRequest, res: Response) {
  try {
    const [
      totalCampaigns,
      totalDonations,
      totalBlocked,
      totalSuccessful,
      raisedSum,
      avgRisk,
      topCampaign,
      recentDonations,
    ] = await Promise.all([
      prisma.campaign.count(),
      prisma.donation.count(),
      prisma.donation.count({ where: { status: "BLOCKED" } }),
      prisma.donation.count({ where: { status: "SUCCESS" } }),
      prisma.campaign.aggregate({ _sum: { raisedAmount: true } }),
      prisma.donation.aggregate({ _avg: { riskScore: true } }),
      prisma.campaign.findFirst({
        orderBy: { raisedAmount: "desc" },
        select: { title: true, raisedAmount: true, goalAmount: true },
      }),
      prisma.donation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          status: true,
          riskScore: true,
          createdAt: true,
          donor: { select: { name: true, email: true } },
          campaign: { select: { title: true, id: true } },
        },
      }),
    ]);

    const totalRaised = raisedSum._sum.raisedAmount ?? 0;
    const avgRiskScore = avgRisk._avg.riskScore ?? 0;
    const fraudRate =
      totalDonations === 0 ? "0.0" : ((totalBlocked / totalDonations) * 100).toFixed(1);

    return res.json({
      totalCampaigns,
      totalDonations,
      totalRaised,
      totalBlocked,
      totalSuccessful,
      avgRiskScore,
      topCampaign: topCampaign ?? { title: "", raisedAmount: 0, goalAmount: 0 },
      recentDonations,
      fraudRate,
    });
  } catch (err) {
    console.error("[stats/overview]", err);
    return res.status(500).json({ message: "Failed to load overview stats" });
  }
}
