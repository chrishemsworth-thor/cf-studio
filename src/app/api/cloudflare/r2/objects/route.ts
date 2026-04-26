import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAuth } from "@/lib/auth";
import { getS3Client } from "@/lib/cloudflare/r2-s3";
import { ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "edge";

export async function GET(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connectionId");
  const bucket = searchParams.get("bucket");
  const prefix = searchParams.get("prefix") ?? "";
  const cursor = searchParams.get("cursor") ?? undefined;
  if (!connectionId || !bucket) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  try {
    const s3 = await getS3Client(env, session.user.id, connectionId);
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix || undefined,
      Delimiter: "/",
      MaxKeys: 50,
      ContinuationToken: cursor,
    }));

    const objects = (res.Contents ?? []).map((obj) => ({
      key: obj.Key!,
      size: obj.Size ?? 0,
      etag: obj.ETag?.replace(/"/g, "") ?? "",
      last_modified: obj.LastModified?.toISOString() ?? "",
      storage_class: obj.StorageClass,
    }));

    const prefixes = (res.CommonPrefixes ?? []).map((p) => p.Prefix!);

    return NextResponse.json({
      objects,
      prefixes,
      nextCursor: res.NextContinuationToken ?? null,
      isTruncated: res.IsTruncated ?? false,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    console.error("[r2/objects GET]", msg, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
