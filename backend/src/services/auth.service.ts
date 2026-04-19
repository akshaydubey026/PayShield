import bcrypt from "bcryptjs";
import type { Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_EXPIRES_MS,
} from "../utils/token.js";

const REFRESH_COOKIE = "refreshToken";
const SALT_ROUNDS = 12;

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_EXPIRES_MS,
    path: "/",
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function register(data: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    const err = new Error("Email already registered") as Error & { status?: number };
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: passwordHash,
      role: data.role,
    },
  });

  return user;
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error("Invalid email or password") as Error & { status?: number };
    err.status = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    const err = new Error("Invalid email or password") as Error & { status?: number };
    err.status = 401;
    throw err;
  }

  return user;
}

export async function createSessionAndTokens(
  user: { id: string; email: string; role: Role; name: string },
  res: Response
) {
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: "",
    },
  });

  const refreshToken = signRefreshToken({
    sub: user.id,
    sid: session.id,
    typ: "refresh",
  });

  const tokenHash = hashRefreshToken(refreshToken);
  await prisma.session.update({
    where: { id: session.id },
    data: { token: tokenHash },
  });

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  setRefreshCookie(res, refreshToken);

  return {
    accessToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function rotateRefreshToken(rawRefresh: string, res: Response) {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefresh);
  } catch {
    const err = new Error("Invalid or expired refresh token") as Error & { status?: number };
    err.status = 401;
    throw err;
  }

  const incomingHash = hashRefreshToken(rawRefresh);
  const session = await prisma.session.findUnique({
    where: { id: payload.sid },
    include: { user: true },
  });

  if (!session || session.userId !== payload.sub) {
    const err = new Error("Invalid session") as Error & { status?: number };
    err.status = 401;
    throw err;
  }

  if (session.token !== incomingHash) {
    // Invalidate this session only. Deleting every session was too aggressive: two tabs
    // refreshing at once could rotate the cookie twice and falsely trigger "reuse".
    await prisma.session.deleteMany({ where: { id: session.id } });
    clearRefreshCookie(res);
    const err = new Error("Session expired or was replaced. Please sign in again.") as Error & {
      status?: number;
    };
    err.status = 401;
    throw err;
  }

  const newRefreshToken = signRefreshToken({
    sub: session.userId,
    sid: session.id,
    typ: "refresh",
  });
  const newHash = hashRefreshToken(newRefreshToken);

  await prisma.session.update({
    where: { id: session.id },
    data: { token: newHash },
  });

  const accessToken = signAccessToken({
    sub: session.user.id,
    email: session.user.email,
    role: session.user.role,
  });

  setRefreshCookie(res, newRefreshToken);

  return {
    accessToken,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    },
  };
}

export async function logout(userId: string, sessionId: string | undefined, res: Response) {
  if (sessionId) {
    await prisma.session.deleteMany({
      where: { id: sessionId, userId },
    });
  }
  clearRefreshCookie(res);
}

export async function logoutAllDevices(userId: string, res: Response) {
  await prisma.session.deleteMany({ where: { userId } });
  clearRefreshCookie(res);
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}

export function readRefreshFromRequest(cookies: Record<string, string | undefined>) {
  return cookies[REFRESH_COOKIE];
}

export { REFRESH_COOKIE };
