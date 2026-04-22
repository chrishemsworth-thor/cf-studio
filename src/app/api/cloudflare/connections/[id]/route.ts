import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { cloudflareConnections } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export const runtime = "edge";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null) as { label?: string } | null;
  if (!body?.label?.trim()) return NextResponse.json({ error: "Missing label" }, { status: 400 });

  const db = getDb(env.DB);
  await db
    .update(cloudflareConnections)
    .set({ label: body.label.trim() })
    .where(and(eq(cloudflareConnections.id, id), eq(cloudflareConnections.userId, session.user.id)));

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
