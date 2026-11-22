import { z } from "zod";
import { hashAccountPassword } from "@/lib/auth-crypto";
import { authSessionCookie, consumeAuthRateLimit, createUser, createUserSession, createWorkspaceId, getAuthenticatedAccount, getWorkspaceId } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(12).max(256) }).strict();
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
    return Response.json({ error: "Send a valid email and password." }, { status: 400, headers });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Enter a valid email and a password with at least 12 characters." }, { status: 400, headers });
  if (getAuthenticatedAccount(request)) return Response.json({ error: "Sign out before creating another account." }, { status: 409, headers });

  const email = parsed.data.email.toLowerCase();
  const limit = consumeAuthRateLimit(`register:${email}`, 4, 60 * 60 * 1000);
  if (!limit.allowed) return Response.json({ error: "Too many account attempts. Try again later." }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } });

  try {
    const { salt, hash } = await hashAccountPassword(parsed.data.password);
    const account = createUser(email, salt, hash, getWorkspaceId(request) ?? createWorkspaceId());
    const session = createUserSession(account.id);
    const responseHeaders = new Headers(headers);
    responseHeaders.append("Set-Cookie", authSessionCookie(session.token));
    responseHeaders.append("Set-Cookie", `aq_workspace=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
    return Response.json({ account: { email: account.email } }, { status: 201, headers: responseHeaders });
  } catch {
    return Response.json({ error: "That email may already have an account, or account setup failed." }, { status: 409, headers });
  }
}
