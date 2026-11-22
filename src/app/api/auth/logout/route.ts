import { clearAuthSessionCookie, getAuthenticatedAccount, revokeUserSession } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get("host")) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
    } catch {
      return Response.json({ error: "Request origin was rejected." }, { status: 403 });
    }
  }
  const account = getAuthenticatedAccount(request);
  revokeUserSession(request);
  const response = Response.json({ signedOut: Boolean(account) }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  response.headers.append("Set-Cookie", clearAuthSessionCookie());
  return response;
}
