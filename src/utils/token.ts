import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

export type AccessPayload = { sub: string; email: string; role: string };
export type RefreshPayload = { sub: string; sid: string; typ: "refresh" };

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AccessPayload & jwt.JwtPayload;
  return { sub: decoded.sub, email: decoded.email, role: decoded.role };
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload &
    jwt.JwtPayload;
  if (decoded.typ !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return { sub: decoded.sub, sid: decoded.sid, typ: "refresh" };
}

export { REFRESH_EXPIRES_MS };
