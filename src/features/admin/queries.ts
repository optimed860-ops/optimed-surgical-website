import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Admin reads run as the signed-in admin, so RLS still applies. Never cached. */

export async function adminCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_path, is_published, display_order, subcategories(id, name, slug), products(count)")
    .order("display_order")
    .order("name");
  type Row = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_path: string | null;
    is_published: boolean;
    display_order: number;
    subcategories: { id: string; name: string; slug: string }[] | null;
    products: { count: number }[] | null;
  };
  return ((data ?? []) as unknown as Row[]).map((c) => ({
    ...c,
    subcategories: c.subcategories ?? [],
    productCount: c.products?.[0]?.count ?? 0,
  }));
}
