import { z } from "zod";
import { debugPlatforms, diagnoseWorkflowError } from "@/lib/debug-diagnostics";

const requestSchema = z
  .object({
    platform: z.enum(debugPlatforms),
    error: z.string().trim().min(5).max(8_000),
    expected: z.string().trim().max(1_000).optional().default(""),
  })
  .strict();

const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) {
    return Response.json(
      { error: "This request is too large. Keep the error log under 8,000 characters." },
      { status: 413, headers: noStoreHeaders }
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return Response.json(
      { error: "I couldn’t read that request. Please try again." },
      { status: 400, headers: noStoreHeaders }
    );
  }

  if (rawBody.length > 16_384) {
    return Response.json(
      { error: "This request is too large. Keep the error log under 8,000 characters." },
      { status: 413, headers: noStoreHeaders }
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json(
      { error: "The request was not valid JSON. Please try again." },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Choose a platform and provide an error message between 5 and 8,000 characters." },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const diagnosis = diagnoseWorkflowError(
    parsed.data.platform,
    parsed.data.error,
    parsed.data.expected
  );

  return Response.json({ diagnosis }, { headers: noStoreHeaders });
}
