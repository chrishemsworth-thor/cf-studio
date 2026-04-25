import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAuth } from "@/lib/auth";
import { getS3Client } from "@/lib/cloudflare/r2-s3";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "edge";

export async function GET(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connectionId");
  const bucket = searchParams.get("bucket");
  const key = searchParams.get("key");
  if (!connectionId || !bucket || !key) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  try {
    const s3 = await getS3Client(env, session.user.id, connectionId);
    const res = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));

    return NextResponse.json({
      key,
      size: res.ContentLength ?? 0,
      content_type: res.ContentType ?? null,
      etag: res.ETag?.replace(/"/g, "") ?? null,
      last_modified: res.LastModified?.toISOString() ?? null,
      storage_class: res.StorageClass ?? null,
      metadata: res.Metadata ?? {},
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
