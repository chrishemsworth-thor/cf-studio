import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { cloudflareConnections } from "@/lib/db/schema";
import { decryptToken } from "@/lib/crypto";
import { createCloudflareClient, CloudflareApiError } from "@/lib/cloudflare/client";
import { and, eq } from "drizzle-orm";

export const runtime = "edge";

export async function POST(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    connectionId: string;
    databaseId: string;
    sql: string;
    params?: unknown[];
  };

  const db = getDb(env.DB);
  const [conn] = await db
    .select()
    .from(cloudflareConnections)
    .where(and(eq(cloudflareConnections.id, body.connectionId), eq(cloudflareConnections.userId, session.user.id)));
  if (!conn) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

  try {
    const client = createCloudflareClient(conn.accountId, await decryptToken(conn.encryptedToken));
    const res = await client.d1.query(body.databaseId, body.sql, body.params ?? []);
    const result = res.result[0];
    return NextResponse.json({
      columns: result.results.columns,
      rows: result.results.rows,
      meta: result.meta,
    });
  } catch (err) {
    const msg = err instanceof CloudflareApiError ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
