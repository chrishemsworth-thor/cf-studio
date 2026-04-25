import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { cloudflareConnections } from "@/lib/db/schema";
import { encryptToken } from "@/lib/crypto";
import { and, eq } from "drizzle-orm";

export const runtime = "edge";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null) as {
    label?: string;
    r2AccessKeyId?: string;
    r2SecretKey?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const db = getDb(env.DB);
  const updates: Record<string, unknown> = {};

  if (body.label?.trim()) updates.label = body.label.trim();
  if (body.r2AccessKeyId?.trim()) updates.r2AccessKeyId = body.r2AccessKeyId.trim();
  if (body.r2SecretKey?.trim()) updates.encryptedR2SecretKey = await encryptToken(body.r2SecretKey.trim());

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const result = await db
    .update(cloudflareConnections)
    .set(updates)
    .where(and(eq(cloudflareConnections.id, id), eq(cloudflareConnections.userId, session.user.id)))
    .returning({ id: cloudflareConnections.id });

  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb(env.DB);
  await db
    .delete(cloudflareConnections)
    .where(and(eq(cloudflareConnections.id, id), eq(cloudflareConnections.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}
