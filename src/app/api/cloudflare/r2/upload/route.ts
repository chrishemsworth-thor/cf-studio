import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAuth } from "@/lib/auth";
import { getS3Client } from "@/lib/cloudflare/r2-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "edge";

export async function POST(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const { auth } = buildAuth(env.DB);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connectionId");
  const bucket = searchParams.get("bucket");
  if (!connectionId || !bucket) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const key = (form.get("key") as string | null) ?? file.name;
    const bytes = await file.arrayBuffer();

    const s3 = await getS3Client(env, session.user.id, connectionId);
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: new Uint8Array(bytes),
      ContentType: file.type || "application/octet-stream",
      ContentLength: bytes.byteLength,
    }));

    return NextResponse.json({ ok: true, key });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
