import { isIP } from "node:net";

/** Fallback used when no valid IP can be derived from the request headers. */
export const UNKNOWN_IP = "Unknown";

export const UNKNOWN_USER_AGENT = "Unknown";

/**
 * Ordered by trust. `x-vercel-forwarded-for` is set by the Vercel edge and is
 * not client-overridable, so it is preferred; `x-forwarded-for` is Vercel's
 * documented way of exposing the visitor's public IP (first entry = client).
 * The remaining entries only matter if the project is fronted by a proxy such
 * as Cloudflare.
 */
const IP_HEADERS = [
  "x-vercel-forwarded-for",
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
  "true-client-ip",
] as const;

const stripIpv4MappedPrefix = (value: string): string =>
  value.startsWith("::ffff:") ? value.slice(7) : value;

const isValidIp = (value: string): boolean => isIP(value) !== 0;

/**
 * Resolves the visitor's public IP address **server-side** from request
 * headers only. Anything sent in the request body is deliberately ignored so a
 * browser (or a bot) can never spoof the address attached to a lead.
 */
export const getClientIp = (headers: Headers): string => {
  for (const header of IP_HEADERS) {
    const raw = headers.get(header);
    if (!raw) continue;

    const candidate = stripIpv4MappedPrefix(
      (raw.split(",")[0] ?? "").trim()
    ).trim();

    if (isValidIp(candidate)) return candidate;
  }

  return UNKNOWN_IP;
};

export const getUserAgent = (headers: Headers): string => {
  const value = headers.get("user-agent")?.trim();
  if (!value) return UNKNOWN_USER_AGENT;
  return value.length > 300 ? `${value.slice(0, 300)}…` : value;
};

export type RequestInfo = {
  /** Visitor's public IP, resolved from request headers (never from the body). */
  ipAddress: string;
  userAgent: string;
};

export const getRequestInfo = (headers: Headers): RequestInfo => ({
  ipAddress: getClientIp(headers),
  userAgent: getUserAgent(headers),
});
