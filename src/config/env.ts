import { z } from "zod";

/**
 * Public settings. Safe in the browser. Next.js inlines NEXT_PUBLIC_* values at
 * build time, so each one must be read with its literal name.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

export type PublicEnv = z.infer<typeof publicSchema>;

let cachedPublic: PublicEnv | undefined;

export function publicEnv(): PublicEnv {
  if (cachedPublic) return cachedPublic;
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (!parsed.success) {
    throw new Error(
      `Missing or invalid public environment variables: ${describe(parsed.error)}. ` +
        "Fill them in .env.local (see .env.example).",
    );
  }
  cachedPublic = parsed.data;
  return cachedPublic;
}

export function describe(error: z.ZodError): string {
  return error.issues.map((issue) => issue.path.join(".")).join(", ");
}
