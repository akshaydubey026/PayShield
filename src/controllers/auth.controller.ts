import type { Response } from "express";
import { z } from "zod";
import type { Role } from "@prisma/client";
import type { AuthedRequest } from "../middleware/auth.middleware.js";
import * as authService from "../services/auth.service.js";
import { verifyRefreshToken } from "../utils/token.js";

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["DONOR", "CREATOR"]).default("DONOR"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req: AuthedRequest, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", issues: parsed.error.flatten() });
  }

  try {
    const user = await authService.register({
      ...parsed.data,
      role: parsed.data.role as Role,
    });
    const tokens = await authService.createSessionAndTokens(user, res);
    return res.status(201).json(tokens);
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 409) {
      return res.status(409).json({ message: err.message });
    }
    console.error(e);
    return res.status(500).json({ message: "Registration failed" });
  }
}

export async function login(req: AuthedRequest, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", issues: parsed.error.flatten() });
  }

  try {
    const user = await authService.login(parsed.data.email, parsed.data.password);
    const tokens = await authService.createSessionAndTokens(user, res);
    return res.json(tokens);
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) {
      return res.status(401).json({ message: err.message });
    }
    console.error(e);
    return res.status(500).json({ message: "Login failed" });
  }
}

export async function refresh(req: AuthedRequest, res: Response) {
  const raw = authService.readRefreshFromRequest(req.cookies as Record<string, string | undefined>);
  if (!raw) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const result = await authService.rotateRefreshToken(raw, res);
    return res.json(result);
  } catch (e) {
    const err = e as Error & { status?: number };
    return res.status(err.status ?? 401).json({ message: err.message ?? "Refresh failed" });
  }
}

export async function logout(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const raw = authService.readRefreshFromRequest(req.cookies as Record<string, string | undefined>);
  let sessionId: string | undefined;
  if (raw) {
    try {
      const payload = verifyRefreshToken(raw);
      sessionId = payload.sid;
    } catch {
      sessionId = undefined;
    }
  }

  await authService.logout(req.user.id, sessionId, res);
  return res.json({ ok: true });
}

export async function logoutAll(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  await authService.logoutAllDevices(req.user.id, res);
  return res.json({ ok: true });
}

export async function me(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await authService.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({ user });
}
