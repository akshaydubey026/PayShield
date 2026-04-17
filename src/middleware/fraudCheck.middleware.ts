import { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../services/rateLimiter.service.js';
import { analyzeFraud } from '../services/fraudDetection.service.js';
import { prisma } from '../lib/prisma.js';
import { publishFraudBlocked } from '../services/kafka.service.js';

export async function fraudCheckMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user?.id;
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      '0.0.0.0';
    const { amount, campaignId } = req.body;

    // If required fields are missing, skip fraud check and let the controller handle validation
    if (!userId || !amount || !campaignId) {
      return next();
    }

    // STEP A: Rate limit check (fastest — Redis sliding window only)
    const rateCheck = await checkRateLimit({
      identifier: `user:${userId}`,
      windowMs: 60 * 1000,
      limit: 15,
    });

    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'RATE_LIMITED',
        message: 'Too many donation attempts. Please wait before trying again.',
        retryAfter: Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
      });
    }

    // STEP B: Full heuristic fraud analysis
    const fraudResult = await analyzeFraud({
      userId,
      ipAddress,
      amount: parseFloat(amount),
      campaignId,
      userAgent: req.headers['user-agent'] || '',
    });

    // STEP C: Attach result to request so the controller can persist it
    (req as any).fraudResult = fraudResult;

    // STEP D: Block if risk score is too high
    if (fraudResult.decision === 'BLOCK') {
      // Save blocked donation to DB for audit trail
      await prisma.donation.create({
        data: {
          amount: parseFloat(amount),
          donorId: userId,
          campaignId,
          status: 'BLOCKED',
          riskScore: fraudResult.riskScore,
          isFlagged: true,
          fraudFlags: fraudResult.fraudFlags,
          fraudReasons: fraudResult.fraudReasons,
        },
      });

      try {
        await publishFraudBlocked({
          userId,
          amount: parseFloat(amount),
          campaignId,
          riskScore: fraudResult.riskScore,
          flags: fraudResult.fraudFlags,
          ipAddress,
          blockedAt: new Date().toISOString(),
        });
      } catch (kafkaErr) {
        console.error("[FraudCheck] Kafka publish skipped:", kafkaErr);
      }

      return res.status(403).json({
        error: 'TRANSACTION_BLOCKED',
        message: 'This transaction was blocked by PayShield fraud detection.',
        riskScore: fraudResult.riskScore,
        flags: fraudResult.fraudFlags,
        reasons: fraudResult.fraudReasons,
        signals: fraudResult.signals,
        decision: 'BLOCK',
      });
    }

    next();
  } catch (err) {
    // Fail open — never block a legitimate user because of our internal error
    console.error('[FraudCheck] Middleware error (failing open):', err);
    next();
  }
}
