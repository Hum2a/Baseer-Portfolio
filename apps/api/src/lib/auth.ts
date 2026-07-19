import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  user,
  session,
  account,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
} from "../db/schema";
import { createDb, type Database } from "../db/client";
import type { Env } from "../env";
import type { Pool } from "@neondatabase/serverless";

function trustedOrigins(appUrl: string): string[] {
  const origins = new Set<string>([appUrl.replace(/\/$/, "")]);
  origins.add("http://localhost:5173");
  origins.add("http://127.0.0.1:5173");
  origins.add("http://localhost:8787");
  origins.add("http://127.0.0.1:8787");
  origins.add("https://baseer.co.uk");
  origins.add("https://staging.baseer.co.uk");
  return [...origins];
}

function buildAuth(env: Env, db: Database) {
  if (!env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET is not configured");
  }
  if (!env.APP_URL) {
    throw new Error("APP_URL is not configured");
  }

  return betterAuth({
    appName: "Baseer Portfolio",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user,
        session,
        account,
        verification,
        userRelations,
        sessionRelations,
        accountRelations,
      },
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.APP_URL.replace(/\/$/, ""),
    basePath: "/api/auth",
    trustedOrigins: trustedOrigins(env.APP_URL),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      disableSignUp: true,
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
      },
    },
  });
}

/**
 * Canonical Better Auth wiring — factory only (Workers expose env per request).
 * Sign-up disabled; only the seeded admin can sign in.
 */
export function createAuth(env: Env) {
  const { db } = createDb(env);
  return buildAuth(env, db);
}

/** Prefer this in request handlers so the Neon pool is always closed. */
export function createAuthSession(env: Env): {
  auth: ReturnType<typeof buildAuth>;
  pool: Pool;
} {
  const { db, pool } = createDb(env);
  return { auth: buildAuth(env, db), pool };
}

export type Auth = ReturnType<typeof buildAuth>;
