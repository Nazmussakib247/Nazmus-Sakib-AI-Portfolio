import crypto from "node:crypto";
import { promisify } from "node:util";
import cookie from "cookie";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_BLOCK_MS = 15 * 60 * 1000;
export const PASSWORD_MIN_LENGTH = 12;
export const RESET_CODE_TTL_MS = 10 * 60 * 1000;
export const RESET_MAX_ATTEMPTS = 5;

const SCRYPT_KEY_LENGTH = 64;
const scryptAsync = promisify(crypto.scrypt);

type CookieOptions = {
  httpOnly: boolean;
  path: string;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
  maxAge?: number;
};

function isLocalhost(headers: Headers): boolean {
  const host = headers.get("host") || "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export function getAdminCookieOptions(headers: Headers, maxAge = ADMIN_SESSION_TTL_SECONDS): CookieOptions {
  const localhost = isLocalhost(headers);
  return {
    httpOnly: true,
    path: "/",
    sameSite: localhost ? "lax" : "strict",
    secure: !localhost,
    maxAge,
  };
}

export function getAdminSessionToken(req: Request): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  return cookie.parse(header)[ADMIN_SESSION_COOKIE] || null;
}

export function setAdminSessionCookie(resHeaders: Headers, reqHeaders: Headers, token: string): void {
  const options = getAdminCookieOptions(reqHeaders);
  resHeaders.append(
    "set-cookie",
    cookie.serialize(ADMIN_SESSION_COOKIE, token, options),
  );
}

export function clearAdminSessionCookie(resHeaders: Headers, reqHeaders: Headers): void {
  const options = getAdminCookieOptions(reqHeaders, 0);
  resHeaders.append(
    "set-cookie",
    cookie.serialize(ADMIN_SESSION_COOKIE, "", options),
  );
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateResetCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashResetCode(email: string, code: string): string {
  return crypto.createHash("sha256").update(`${email}:${code}`).digest("hex");
}

export function secureStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, salt, expectedHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex || !/^[0-9a-f]+$/i.test(expectedHex)) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scryptAsync(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export function getLoginIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
  return hashSessionToken(address.toLowerCase());
}

export function isStrongPassword(password: string): boolean {
  const characterClasses = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  return password.length >= PASSWORD_MIN_LENGTH && characterClasses >= 3;
}

export function getBootstrapPassword(): string | null {
  const configured = process.env.ADMIN_PASSWORD?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : "nazmus-admin-2026";
}
