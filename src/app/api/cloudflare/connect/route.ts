import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { cloudflareConnections } from "@/lib/db/schema";
import { encryptToken } from "@/lib/crypto";
import { createCloudflareClient, CloudflareApiError } from "@/lib/cloudflare/client";

export const runtime = "edge";

export async function POST(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { label?: string; accountId?: string; apiToken?: string } | null;
  if (!body?.label || !body?.accountId || !body?.apiToken) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const client = createCloudflareClient(body.accountId, body.apiToken);
    await client.d1.listDatabases();
  } catch (err) {
    const msg = err instanceof CloudflareApiError ? err.message : "Invalid credentials";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const encryptedToken = await encryptToken(body.apiToken);
  const db = getDb(env.DB);
  await db.insert(cloudflareConnections).values({
    userId: session.user.id,
    label: body.label,
    accountId: body.accountId,
    encryptedToken,
  });

  return NextResponse.json({ ok: true });
}
