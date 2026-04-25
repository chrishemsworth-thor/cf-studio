import { S3Client } from "@aws-sdk/client-s3";
import { getDb } from "@/lib/db";
import { cloudflareConnections } from "@/lib/db/schema";
import { decryptToken } from "@/lib/crypto";
import { and, eq } from "drizzle-orm";

export const R2_NO_CREDS_ERROR = "R2 credentials not configured";

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
