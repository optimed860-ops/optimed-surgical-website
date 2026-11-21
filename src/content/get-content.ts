import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { mergeContent, type SiteContent } from "./editable";

/** Website text: built-in defaults merged with what admins saved. Cached; refreshed on save. */
export async function getSiteContent(): Promise<SiteContent> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings", "content");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return mergeContent(null);
  }
  const { data, error } = await createPublicClient()
    .from("site_settings")
    .select("setting_value")
    .eq("setting_key", "site_content")
    .maybeSingle();
  if (error) console.error("[content] load failed", error.message);
  return mergeContent(data?.setting_value ?? null);
}
