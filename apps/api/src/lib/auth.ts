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
import { createDb } from "../db/client";
import type { Env } from "../env";

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

/**
 * Canonical Better Auth wiring — factory only (Workers expose env per request).
 * Sign-up disabled; only the seeded admin can sign in.
 */
export function createAuth(env: Env) {
  const { db } = createDb(env);

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

export type Auth = ReturnType<typeof createAuth>;
