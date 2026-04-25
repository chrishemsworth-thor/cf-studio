import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAuth } from "@/lib/auth";
import { getS3Client } from "@/lib/cloudflare/r2-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "edge";

export async function POST(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { connectionId: string; bucket: string; key: string; expiresIn?: number };
  const { connectionId, bucket, key } = body;
  const expiresIn = Math.min(Math.max(Number(body.expiresIn) || 3600, 1), 604800);
  if (!connectionId || !bucket || !key) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  try {
    const s3 = await getS3Client(env, session.user.id, connectionId);
    const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
    return NextResponse.json({ url, expiresIn });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
