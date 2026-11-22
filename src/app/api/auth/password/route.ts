import { z } from "zod";
import { hashAccountPassword, verifyAccountPassword } from "@/lib/auth-crypto";
import { authSessionCookie, changeUserPassword, clearAuthRateLimit, consumeAuthRateLimit, createUserSession, findUserByEmail, getAuthenticatedAccount } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ currentPassword: z.string().min(1).max(256), newPassword: z.string().min(12).max(256) }).strict();
const headers = { "Cache-Control": "no-store, max-age=0" };

function sameOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403, headers });
  const account = getAuthenticatedAccount(request);
  if (!account) return Response.json({ error: "Sign in before changing your password." }, { status: 401, headers });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4_096) return Response.json({ error: "Request is too large." }, { status: 413, headers });

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4_096) return Response.json({ error: "Request is too large." }, { status: 413, headers });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Enter your current password and a new password." }, { status: 400, headers });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Enter your current password and a new password with at least 12 characters." }, { status: 400, headers });

  const rateLimitKey = `password-change:${account.id}`;
  const limit = consumeAuthRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
  if (!limit.allowed) return Response.json({ error: "Too many password attempts. Try again later." }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } });

  try {
    const user = findUserByEmail(account.email);
    const valid = await verifyAccountPassword(parsed.data.currentPassword, user?.password_salt ?? null, user?.password_hash ?? null);
    if (!user || !valid) return Response.json({ error: "Current password is incorrect." }, { status: 401, headers });
    const { salt, hash } = await hashAccountPassword(parsed.data.newPassword);
    changeUserPassword(account.id, salt, hash);
    clearAuthRateLimit(rateLimitKey);
    const session = createUserSession(account.id);
    const responseHeaders = new Headers(headers);
    responseHeaders.append("Set-Cookie", authSessionCookie(session.token));
    return Response.json({ changed: true, signedOutOtherSessions: true }, { headers: responseHeaders });
  } catch {
    return Response.json({ error: "Could not change the password right now." }, { status: 500, headers });
  }
}
