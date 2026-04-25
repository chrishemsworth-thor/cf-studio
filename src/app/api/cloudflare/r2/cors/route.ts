import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { cloudflareConnections } from "@/lib/db/schema";
import { decryptToken } from "@/lib/crypto";
import { createCloudflareClient } from "@/lib/cloudflare/client";
import { and, eq } from "drizzle-orm";
import type { R2CorsRule } from "@/types/cloudflare";

export const runtime = "edge";

async function getClient(env: CloudflareEnv, userId: string, connectionId: string) {
  const db = getDb(env.DB);
  const [conn] = await db
    .select()
    .from(cloudflareConnections)
    .where(and(eq(cloudflareConnections.id, connectionId), eq(cloudflareConnections.userId, userId)));
  if (!conn) throw new Error("Connection not found");
  return createCloudflareClient(conn.accountId, await decryptToken(conn.encryptedToken));
}

export async function GET(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connectionId");
  const bucket = searchParams.get("bucket");
  if (!connectionId || !bucket) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  try {
    const client = await getClient(env, session.user.id, connectionId);
    const res = await client.r2.getCors(bucket);
    return NextResponse.json({ rules: res.result.rules ?? [] });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connectionId");
  const bucket = searchParams.get("bucket");
  if (!connectionId || !bucket) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const body = await request.json() as { rules: R2CorsRule[] };

  try {
    const client = await getClient(env, session.user.id, connectionId);
    await client.r2.putCors(bucket, body.rules);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
