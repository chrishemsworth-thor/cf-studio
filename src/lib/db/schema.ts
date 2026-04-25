import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export const accounts = sqliteTable("account", {
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const cloudflareConnections = sqliteTable("cloudflare_connection", {
  id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  accountId: text("accountId").notNull(),
  encryptedToken: text("encryptedToken").notNull(),
  r2AccessKeyId: text("r2AccessKeyId"),
  encryptedR2SecretKey: text("encryptedR2SecretKey"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const savedQueries = sqliteTable("saved_query", {
  id: text("id").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  connectionId: text("connectionId").notNull().references(() => cloudflareConnections.id, { onDelete: "cascade" }),
  databaseId: text("databaseId").notNull(),
  name: text("name").notNull(),
  sql: text("sql").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});
