import { z } from "zod";
import { verifyAccountPassword } from "@/lib/auth-crypto";
import { authSessionCookie, clearAuthRateLimit, consumeAuthRateLimit, createUserSession, findUserByEmail, getAuthenticatedAccount } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(256) }).strict();
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
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4_096) return Response.json({ error: "Request is too large." }, { status: 413, headers });
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4_096) return Response.json({ error: "Request is too large." }, { status: 413, headers });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Enter your email and password." }, { status: 400, headers });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Enter a valid email and password." }, { status: 400, headers });
  if (getAuthenticatedAccount(request)) return Response.json({ error: "You are already signed in." }, { status: 409, headers });

  const email = parsed.data.email.toLowerCase();
  const rateLimitKey = `login:${email}`;
  const limit = consumeAuthRateLimit(rateLimitKey, 8, 15 * 60 * 1000);
  if (!limit.allowed) return Response.json({ error: "Too many sign-in attempts. Try again in a few minutes." }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } });

  try {
    const user = findUserByEmail(email);
    const valid = await verifyAccountPassword(parsed.data.password, user?.password_salt ?? null, user?.password_hash ?? null);
    if (!user || !valid) return Response.json({ error: "Email or password is incorrect." }, { status: 401, headers });
    clearAuthRateLimit(rateLimitKey);
    const session = createUserSession(user.id);
    const responseHeaders = new Headers(headers);
    responseHeaders.append("Set-Cookie", authSessionCookie(session.token));
    return Response.json({ account: { email: user.email } }, { headers: responseHeaders });
  } catch {
    return Response.json({ error: "Could not sign in right now." }, { status: 500, headers });
  }
}
