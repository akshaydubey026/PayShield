import redis from '../config/redis.config.js';
import { prisma } from '../lib/prisma.js';

export interface FraudAnalysisResult {
  riskScore: number;
  isFlagged: boolean;
  fraudFlags: string[];
  fraudReasons: string[];
  decision: 'ALLOW' | 'REVIEW' | 'BLOCK';
  signals: {
    velocityScore: number;
    amountScore: number;
    duplicateScore: number;
    behaviorScore: number;
    reputationScore: number;
  };
}

export async function analyzeFraud(payload: {
  userId: string;
  ipAddress: string;
  amount: number;
  campaignId: string;
  userAgent: string;
}): Promise<FraudAnalysisResult> {
  const flags: string[] = [];
  const reasons: string[] = [];
  const signals = {
    velocityScore: 0,
    amountScore: 0,
    duplicateScore: 0,
    behaviorScore: 0,
    reputationScore: 0,
  };

  const now = Date.now();
  const window60s = 60 * 1000;

  // ─────────────────────────────────────────────
  // SIGNAL 1 — Velocity Check (max 30 points)
  // ─────────────────────────────────────────────
  const userVelKey = `velocity:user:${payload.userId}`;
  const ipVelKey = `velocity:ip:${payload.ipAddress}`;

  // Count donations by this user in last 60s
  await redis.zadd(userVelKey, now, `${now}-${Math.random()}`);
  await redis.expire(userVelKey, 65);
  await redis.zremrangebyscore(userVelKey, 0, now - window60s);
  const userVelCount = await redis.zcard(userVelKey);

  if (userVelCount >= 4) {
    signals.velocityScore = 30;
    flags.push('EXTREME_VELOCITY_USER');
    reasons.push('More than 4 donations in the last 60 seconds from this account.');
  } else if (userVelCount >= 2) {
    signals.velocityScore = 15;
    flags.push('HIGH_VELOCITY_USER');
    reasons.push('Multiple donations in the last 60 seconds from this account.');
  }

  // Count requests from same IP in last 60s
  await redis.zadd(ipVelKey, now, `${now}-${Math.random()}`);
  await redis.expire(ipVelKey, 65);
  await redis.zremrangebyscore(ipVelKey, 0, now - window60s);
  const ipVelCount = await redis.zcard(ipVelKey);

  if (ipVelCount >= 5) {
    signals.velocityScore = Math.min(30, signals.velocityScore + 20);
    flags.push('SUSPICIOUS_IP_VELOCITY');
    reasons.push('High number of requests from the same IP in the last 60 seconds.');
  }

  // ─────────────────────────────────────────────
  // SIGNAL 2 — Amount Anomaly (max 25 points)
  // ─────────────────────────────────────────────
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const pastDonations = await prisma.donation.findMany({
    where: {
      donorId: payload.userId,
      status: 'SUCCESS',
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { amount: true },
  });

  if (pastDonations.length > 0) {
    const avgAmount =
      pastDonations.reduce((sum: number, d: { amount: number }) => sum + d.amount, 0) / pastDonations.length;

    const ratio = payload.amount / avgAmount;
    if (ratio > 10) {
      signals.amountScore = 25;
      flags.push('AMOUNT_SPIKE_EXTREME');
      reasons.push(`Donation amount is ${ratio.toFixed(1)}x your average — extreme spike detected.`);
    } else if (ratio > 5) {
      signals.amountScore = 15;
      flags.push('AMOUNT_SPIKE_HIGH');
      reasons.push(`Donation amount is ${ratio.toFixed(1)}x your average — significant spike detected.`);
    } else if (ratio > 3) {
      signals.amountScore = 8;
      flags.push('AMOUNT_SPIKE_MODERATE');
      reasons.push(`Donation amount is ${ratio.toFixed(1)}x your average.`);
    }
  }

  if (payload.amount > 50000) {
    signals.amountScore = Math.min(15, signals.amountScore + 15);
    flags.push('LARGE_ABSOLUTE_AMOUNT');
    // Only 15 points — not enough to block alone
    // Needs OTHER signals too to reach 61+ (BLOCK)
    reasons.push('Donation amount exceeds ₹50,000 — high-value transaction flagged for review.');
  }

  // ─────────────────────────────────────────────
  // SIGNAL 3 — Rapid repeat to same campaign (double-submit / card testing)
  // Short window only — legitimate donors often give to the same campaign multiple times.
  // ─────────────────────────────────────────────
  const dupKey = `campaign_donate:${payload.userId}:${payload.campaignId}`;
  const isDuplicate = await redis.exists(dupKey);

  if (isDuplicate) {
    signals.duplicateScore = 10;
    flags.push('REPEAT_DONATION_SAME_CAMPAIGN');
    reasons.push('Another donation to this campaign started very recently (possible duplicate click).');
  }

  // ─────────────────────────────────────────────
  // SIGNAL 4 — Behavioral (max 15 points)
  // ─────────────────────────────────────────────
  const isRoundAmount = payload.amount % 100 === 0;
  const isSuspiciousAgent =
    !payload.userAgent ||
    payload.userAgent.toLowerCase().includes('curl') ||
    payload.userAgent.toLowerCase().includes('python') ||
    payload.userAgent.toLowerCase().includes('bot') ||
    payload.userAgent.toLowerCase().includes('scraper');

  if (isSuspiciousAgent) {
    signals.behaviorScore += 15;
    flags.push('BOT_LIKE_USER_AGENT');
    reasons.push('Request originated from a non-browser client (curl, bot, or scripted request).');
  } else if (isRoundAmount && userVelCount >= 2) {
    signals.behaviorScore += 5;
    flags.push('ROUND_AMOUNT_HIGH_VELOCITY');
    reasons.push('Round-number amount combined with high velocity is a common bot pattern.');
  }

  // ─────────────────────────────────────────────
  // SIGNAL 5 — IP Reputation (max 10 points)
  // ─────────────────────────────────────────────
  const isBlacklisted = await redis.sismember('blocked_ips', payload.ipAddress);

  if (isBlacklisted) {
    return {
      riskScore: 100,
      isFlagged: true,
      fraudFlags: ['BLACKLISTED_IP'],
      fraudReasons: ['Your IP address has been blocked by PayShield fraud detection.'],
      decision: 'BLOCK',
      signals: { ...signals, reputationScore: 100 },
    };
  }

  // Count distinct users from this IP in last 1h
  const ipUsersKey = `ip_users:${payload.ipAddress}`;
  await redis.sadd(ipUsersKey, payload.userId);
  await redis.expire(ipUsersKey, 3600);
  const distinctUsers = await redis.scard(ipUsersKey);

  if (distinctUsers >= 3) {
    signals.reputationScore = 10;
    flags.push('SHARED_IP_MULTI_ACCOUNT');
    reasons.push('Multiple different accounts are donating from the same IP address.');
  }

  // ─────────────────────────────────────────────
  // FINAL SCORE + DECISION
  // ─────────────────────────────────────────────
  const riskScore = Math.min(
    100,
    signals.velocityScore +
    signals.amountScore +
    signals.duplicateScore +
    signals.behaviorScore +
    signals.reputationScore
  );

  let decision: 'ALLOW' | 'REVIEW' | 'BLOCK';
  if (riskScore >= 61) decision = 'BLOCK';
  else if (riskScore >= 31) decision = 'REVIEW';
  else decision = 'ALLOW';

  const isFlagged = riskScore >= 31;

  // Cache result in Redis for 1h
  await redis.setex(
    `fraud:result:${payload.userId}:${now}`,
    3600,
    JSON.stringify({ riskScore, decision, flags, reasons, signals })
  );

  return {
    riskScore,
    isFlagged,
    fraudFlags: flags,
    fraudReasons: reasons,
    decision,
    signals,
  };
}
