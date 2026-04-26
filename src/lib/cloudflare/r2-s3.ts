import { S3Client } from "@aws-sdk/client-s3";
import { getDb } from "@/lib/db";
import { cloudflareConnections } from "@/lib/db/schema";
import { decryptToken } from "@/lib/crypto";
import { and, eq } from "drizzle-orm";

// DOMParser polyfill — AWS SDK v3 uses it for XML parsing in browser/edge mode.
// Not available in Node.js (local dev via @opennextjs/cloudflare). No-op in
// Cloudflare Workers production where DOMParser is natively available.
// Polyfill browser DOM globals required by AWS SDK v3 XML parser.
// Not present in Node.js (local dev) — no-op in Cloudflare Workers where they exist natively.
if (typeof (globalThis as Record<string, unknown>).DOMParser === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const xmldom = require("@xmldom/xmldom") as { DOMParser: unknown; Node: unknown };
  (globalThis as Record<string, unknown>).DOMParser = xmldom.DOMParser;
  (globalThis as Record<string, unknown>).Node = xmldom.Node;
}

export { R2_NO_CREDS_ERROR } from "@/lib/cloudflare/r2-constants";

export function createS3Client(accountId: string, accessKeyId: string, secretAccessKey: string): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function getS3Client(env: CloudflareEnv, userId: string, connectionId: string): Promise<S3Client> {
  const db = getDb(env.DB);
  const [conn] = await db
    .select()
    .from(cloudflareConnections)
    .where(and(eq(cloudflareConnections.id, connectionId), eq(cloudflareConnections.userId, userId)));
  if (!conn) throw new Error("Connection not found");
  if (!conn.r2AccessKeyId || !conn.encryptedR2SecretKey) throw new Error(R2_NO_CREDS_ERROR);
  const secretKey = await decryptToken(conn.encryptedR2SecretKey);
  return createS3Client(conn.accountId, conn.r2AccessKeyId, secretKey);
}
