import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAuth } from "@/lib/auth";
import { getS3Client } from "@/lib/cloudflare/r2-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

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
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

    const contentType = res.ContentType ?? "application/octet-stream";
    const filename = key.split("/").pop() ?? "download";

    const body = res.Body;
    if (!body) return NextResponse.json({ error: "Empty object" }, { status: 404 });

    const ascii = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "_");
    const encoded = encodeURIComponent(filename);

    const stream = body.transformToWebStream();
    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`,
        ...(res.ContentLength ? { "Content-Length": String(res.ContentLength) } : {}),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
