import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { cloudflareConnections } from "@/lib/db/schema";
import { decryptToken } from "@/lib/crypto";
import { createCloudflareClient } from "@/lib/cloudflare/client";
import { and, eq } from "drizzle-orm";

export const runtime = "edge";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connectionId")!;
  const databaseId = searchParams.get("databaseId")!;
  const table = searchParams.get("table")!;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const db = getDb(env.DB);
  const [conn] = await db
    .select()
    .from(cloudflareConnections)
    .where(and(eq(cloudflareConnections.id, connectionId), eq(cloudflareConnections.userId, session.user.id)));
  if (!conn) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

  try {
    const client = createCloudflareClient(conn.accountId, await decryptToken(conn.encryptedToken));
    const safeName = JSON.stringify(table);

    const [dataRes, countRes] = await Promise.all([
      client.d1.query(databaseId, `SELECT rowid, * FROM ${safeName} LIMIT ${PAGE_SIZE} OFFSET ${offset}`),
      client.d1.query(databaseId, `SELECT COUNT(*) as count FROM ${safeName}`),
    ]);

    const data = dataRes.result[0].results;
    const total = Number((countRes.result[0].results.rows[0] as unknown[])[0]);

    return NextResponse.json({ columns: data.columns, rows: data.rows, total, page, pageSize: PAGE_SIZE });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    connectionId: string;
    databaseId: string;
    table: string;
    column: string;
    value: unknown;
    rowid: number;
  };

  const db = getDb(env.DB);
  const [conn] = await db
    .select()
    .from(cloudflareConnections)
    .where(and(eq(cloudflareConnections.id, body.connectionId), eq(cloudflareConnections.userId, session.user.id)));
  if (!conn) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

  try {
    const client = createCloudflareClient(conn.accountId, await decryptToken(conn.encryptedToken));
    const safeName = JSON.stringify(body.table);
    const safeCol = JSON.stringify(body.column);
    await client.d1.query(
      body.databaseId,
      `UPDATE ${safeName} SET ${safeCol} = ? WHERE rowid = ?`,
      [body.value, body.rowid]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
