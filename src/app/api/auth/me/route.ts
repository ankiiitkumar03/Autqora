import { getAuthenticatedAccount } from "@/lib/project-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const account = getAuthenticatedAccount(request);
  return Response.json({ account: account ? { email: account.email } : null }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
