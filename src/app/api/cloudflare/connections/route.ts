import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { cloudflareConnections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

export async function GET() {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb(env.DB);
  const connections = await db
    .select({
      id: cloudflareConnections.id,
      label: cloudflareConnections.label,
      accountId: cloudflareConnections.accountId,
    })
    .from(cloudflareConnections)
    .where(eq(cloudflareConnections.userId, session.user.id));

  return NextResponse.json({ connections });
}
