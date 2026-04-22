import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/lib/db";

export function buildAuth(d1: D1Database) {
  const db = getDb(d1);
  return NextAuth({
    adapter: DrizzleAdapter(db),
    providers: [GitHub, Google],
    session: { strategy: "database" },
    pages: { signIn: "/login" },
  });
}
