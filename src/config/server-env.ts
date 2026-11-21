import "server-only";
import { z } from "zod";
import { describe } from "./env";

/** Server-only secrets. Importing this file from a Client Component fails the build. */
const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(20),
  RATE_LIMIT_HMAC_SECRET: z.string().min(32),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cachedServer: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cachedServer) return cachedServer;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Missing or invalid server environment variables: ${describe(parsed.error)}. ` +
        "Fill them in .env.local (see .env.example).",
    );
  }
  cachedServer = parsed.data;
  return cachedServer;
}
