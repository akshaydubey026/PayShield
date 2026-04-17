import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";
import redis from "../config/redis.config.js";

const originRouter = Router();

// GET /api/fraud/stats
originRouter.get("/stats", requireAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalBlocked, totalReviewed, stats, allFlags] = await Promise.all([
      prisma.donation.count({ where: { status: "BLOCKED", createdAt: { gte: today } } }),
      prisma.donation.count({ where: { status: "PENDING", riskScore: { gt: 30 }, createdAt: { gte: today } } }),
      prisma.donation.aggregate({
        where: { createdAt: { gte: today } },
        _avg: { riskScore: true },
      }),
      prisma.donation.findMany({
        where: { createdAt: { gte: today } },
        select: { fraudFlags: true, amount: true, status: true },
      })
    ]);

    const blockedAmount = allFlags
      .filter((d) => d.status === "BLOCKED")
      .reduce((sum, d) => sum + d.amount, 0);

    const flagCounts: Record<string, number> = {};
    allFlags.forEach((d) => {
      d.fraudFlags.forEach((flag) => {
        flagCounts[flag] = (flagCounts[flag] || 0) + 1;
      });
    });

    const topFlags = Object.entries(flagCounts)
      .map(([flag, count]) => ({ flag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return res.json({
      totalBlocked,
      totalReviewed,
      avgRiskScore: stats._avg.riskScore || 0,
      blockedAmount,
      topFlags,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

// GET /api/fraud/feed
originRouter.get("/feed", requireAuth, async (req, res) => {
  try {
    const donations = await prisma.donation.findMany({
      where: { riskScore: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amount: true,
        donorId: true,
        campaignId: true,
        status: true,
        riskScore: true,
        fraudFlags: true,
        createdAt: true,
        donor: { select: { name: true } },
      },
    });

    return res.json(donations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch feed" });
  }
});

// POST /api/fraud/block-ip
originRouter.post("/block-ip", requireAuth, async (req, res) => {
  try {
    const { ipAddress } = req.body;
    if (!ipAddress) return res.status(400).json({ message: "IP required" });

    await redis.sadd("blocked_ips", ipAddress);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to block IP" });
  }
});

export default originRouter;
