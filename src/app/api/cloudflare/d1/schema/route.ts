import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { cloudflareConnections } from "@/lib/db/schema";
import { decryptToken } from "@/lib/crypto";
import { createCloudflareClient } from "@/lib/cloudflare/client";
import { and, eq } from "drizzle-orm";
import type { D1TableSchema, D1ColumnInfo, D1IndexInfo, D1ForeignKeyInfo } from "@/types/cloudflare";

export const runtime = "edge";

export async function GET(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connectionId")!;
  const databaseId = searchParams.get("databaseId")!;

  const db = getDb(env.DB);
  const [conn] = await db
    .select()
    .from(cloudflareConnections)
    .where(and(eq(cloudflareConnections.id, connectionId), eq(cloudflareConnections.userId, session.user.id)));
  if (!conn) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

  try {
    const client = createCloudflareClient(conn.accountId, await decryptToken(conn.encryptedToken));

    async function runQuery(sql: string) {
      const res = await client.d1.query(databaseId, sql);
      return res.result[0].results;
    }

    const tableList = await runQuery(
      "SELECT name FROM pragma_table_list() WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    const tableNames = tableList.rows.map((r) => String((r as unknown[])[0]));

    const tables: D1TableSchema[] = await Promise.all(
      tableNames.map(async (name) => {
        const escaped = name.replace(/'/g, "''");
        const [cols, idxs, fks] = await Promise.all([
          runQuery(`SELECT * FROM pragma_table_info('${escaped}')`),
          runQuery(`SELECT * FROM pragma_index_list('${escaped}')`),
          runQuery(`SELECT * FROM pragma_foreign_key_list('${escaped}')`),
        ]);

        const toObj = <T>(results: { columns: string[]; rows: unknown[][] }): T[] =>
          results.rows.map((row) => {
            const obj: Record<string, unknown> = {};
            results.columns.forEach((col, i) => {
              obj[col] = (row as unknown[])[i];
            });
            return obj as T;
          });

        return {
          name,
          columns: toObj<D1ColumnInfo>(cols),
          indexes: toObj<D1IndexInfo>(idxs),
          foreignKeys: toObj<D1ForeignKeyInfo>(fks),
        };
      })
    );

    return NextResponse.json({ tables });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
