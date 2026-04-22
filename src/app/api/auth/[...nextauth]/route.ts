import { buildAuth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const { handlers } = buildAuth(env.DB);
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const { handlers } = buildAuth(env.DB);
  return handlers.POST(request);
}
