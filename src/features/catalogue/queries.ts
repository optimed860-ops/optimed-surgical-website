import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { SpecificationEntry } from "@/types/database";
import type {
  CategorySummary,
  Certification,
  ImageRef,
  ProductDetail,
  ProductPage,
  ProductSummary,
  SiteSettings,
} from "./types";
import { sanitizeSearch } from "./search";
import { CONTACT } from "@/content/site";

/**
 * Public catalogue reads. They run as an anonymous visitor (RLS = published
 * content only) and are cached with tags, so admin changes can refresh them
 * through updateTag/revalidateTag. Every function degrades to an empty
 * result if the database isn't reachable or set up, so the site still renders.
 */

export const CATALOGUE_TAGS = {
  categories: "categories",
  products: "products",
  certifications: "certifications",
  settings: "settings",
} as const;

export const PAGE_SIZE = 24;

type ImageRow = { storage_path: string; alt_text: string | null; is_primary: boolean; display_order: number };

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  product_code: string | null;
  short_description: string | null;
  categories: { slug: string; name: string } | null;
  product_images: ImageRow[] | null;
};

const PRODUCT_CARD_SELECT =
  "id, name, slug, product_code, short_description, categories(slug, name), product_images(storage_path, alt_text, is_primary, display_order)";

function sortImages(images: ImageRow[] | null | undefined): ImageRef[] {
  return [...(images ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.display_order - b.display_order)
    .map((img) => ({ path: img.storage_path, alt: img.alt_text }));
}

function toSummary(row: ProductRow): ProductSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    productCode: row.product_code,
    shortDescription: row.short_description,
    categorySlug: row.categories?.slug ?? null,
    categoryName: row.categories?.name ?? null,
    image: sortImages(row.product_images)[0] ?? null,
  };
}

function logError(scope: string, error: unknown) {
  if (error) console.error(`[catalogue:${scope}]`, (error as { message?: string }).message ?? error);
}

function hasSupabase() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<CategorySummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOGUE_TAGS.categories, CATALOGUE_TAGS.products);
  if (!hasSupabase()) return [];

  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id, name, slug, description, image_path, subcategories(id, name, slug, description, display_order, is_published), products(count)")
    .order("display_order")
    .order("name");
  if (error || !data) {
    logError("getCategories", error);
    return [];
  }

  type Row = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_path: string | null;
    subcategories: { id: string; name: string; slug: string; description: string | null; display_order: number }[] | null;
    products: { count: number }[] | null;
  };

  return (data as unknown as Row[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imagePath: row.image_path,
    productCount: row.products?.[0]?.count ?? 0,
    subcategories: [...(row.subcategories ?? [])]
      .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name))
      .map(({ id, name, slug, description }) => ({ id, name, slug, description })),
  }));
}

export async function getCategoryBySlug(slug: string): Promise<CategorySummary | null> {
  const categories = await getCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function getFeaturedProducts(limit = 8): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOGUE_TAGS.products);
  if (!hasSupabase()) return [];

  const db = createPublicClient();
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("is_featured", true)
    .order("featured_order")
    .order("name")
    .limit(limit);
  if (error) {
    logError("getFeaturedProducts", error);
    return [];
  }
  const featured = (data as unknown as ProductRow[]).map(toSummary);
  if (featured.length > 0) return featured;

  // Nothing marked featured yet: show the newest published products instead.
  const latest = await db.from("products").select(PRODUCT_CARD_SELECT).order("created_at", { ascending: false }).limit(limit);
  logError("getFeaturedProducts:fallback", latest.error);
  return ((latest.data ?? []) as unknown as ProductRow[]).map(toSummary);
}

export type ProductQuery = {
  q?: string;
  categoryId?: string;
  subcategoryId?: string;
  page?: number;
};

export async function listProducts(query: ProductQuery): Promise<ProductPage> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOGUE_TAGS.products);

  const page = Math.max(1, query.page ?? 1);
  const empty: ProductPage = { items: [], total: 0, page, pageCount: 0, pageSize: PAGE_SIZE };
  if (!hasSupabase()) return empty;

  let request = createPublicClient()
    .from("products")
    .select(PRODUCT_CARD_SELECT, { count: "exact" })
    .order("name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (query.categoryId) request = request.eq("category_id", query.categoryId);
  if (query.subcategoryId) request = request.eq("subcategory_id", query.subcategoryId);

  const q = sanitizeSearch(query.q);
  if (q) request = request.or(`name.ilike.%${q}%,product_code.ilike.%${q}%`);

  const { data, error, count } = await request;
  if (error) {
    // Requesting a page past the end returns a range error; treat as empty.
    logError("listProducts", error);
    return empty;
  }
  const total = count ?? 0;
  return {
    items: (data as unknown as ProductRow[]).map(toSummary),
    total,
    page,
    pageCount: Math.ceil(total / PAGE_SIZE),
    pageSize: PAGE_SIZE,
  };
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOGUE_TAGS.products, `product:${slug}`);
  if (!hasSupabase()) return null;

  const { data, error } = await createPublicClient()
    .from("products")
    .select(
      "id, name, slug, product_code, manufacturer, short_description, description, specifications, category_id, subcategory_id, updated_at, categories(slug, name), subcategories(slug, name), product_images(storage_path, alt_text, is_primary, display_order)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) {
    logError("getProductBySlug", error);
    return null;
  }

  const row = data as unknown as ProductRow & {
    manufacturer: string | null;
    description: string | null;
    specifications: unknown;
    category_id: string;
    subcategory_id: string | null;
    updated_at: string;
    subcategories: { slug: string; name: string } | null;
  };

  const specifications = Array.isArray(row.specifications)
    ? (row.specifications as unknown[]).filter(
        (entry): entry is SpecificationEntry =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as SpecificationEntry).label === "string" &&
          typeof (entry as SpecificationEntry).value === "string",
      )
    : [];

  return {
    ...toSummary(row),
    manufacturer: row.manufacturer,
    description: row.description,
    specifications,
    images: sortImages(row.product_images),
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    subcategoryName: row.subcategories?.name ?? null,
    subcategorySlug: row.subcategories?.slug ?? null,
    updatedAt: row.updated_at,
  };
}

export async function getRelatedProducts(product: ProductDetail, limit = 4): Promise<ProductSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOGUE_TAGS.products);
  if (!hasSupabase()) return [];

  const db = createPublicClient();
  const base = () => db.from("products").select(PRODUCT_CARD_SELECT).neq("id", product.id).order("name").limit(limit);

  const sameSub = product.subcategoryId
    ? await base().eq("subcategory_id", product.subcategoryId)
    : { data: [], error: null };
  let rows = (sameSub.data ?? []) as unknown as ProductRow[];

  if (rows.length < limit) {
    const sameCat = await base().eq("category_id", product.categoryId);
    logError("getRelatedProducts", sameCat.error);
    const seen = new Set(rows.map((r) => r.id));
    rows = [...rows, ...((sameCat.data ?? []) as unknown as ProductRow[]).filter((r) => !seen.has(r.id))];
  }
  return rows.slice(0, limit).map(toSummary);
}

/** Current public details for products in a visitor's quote list. Unknown or unpublished IDs are dropped. */
export async function getProductsByIds(ids: string[]): Promise<ProductSummary[]> {
  if (!hasSupabase() || ids.length === 0) return [];
  const { data, error } = await createPublicClient().from("products").select(PRODUCT_CARD_SELECT).in("id", ids);
  if (error) {
    logError("getProductsByIds", error);
    return [];
  }
  return (data as unknown as ProductRow[]).map(toSummary);
}

/** All published product slugs (sitemap). */
export async function getAllProductSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOGUE_TAGS.products);
  if (!hasSupabase()) return [];
  const { data, error } = await createPublicClient().from("products").select("slug, updated_at").limit(50_000);
  if (error) {
    logError("getAllProductSlugs", error);
    return [];
  }
  return (data ?? []).map((row) => ({ slug: row.slug, updatedAt: row.updated_at }));
}

// ── Certifications ────────────────────────────────────────────────────────────

export async function getCertifications(): Promise<Certification[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOGUE_TAGS.certifications);
  if (!hasSupabase()) return [];

  const { data, error } = await createPublicClient()
    .from("certifications")
    .select("id, title, description, document_type, issue_date, expiry_date")
    .order("display_order")
    .order("title");
  if (error || !data) {
    logError("getCertifications", error);
    return [];
  }
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    documentType: row.document_type,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
  }));
}

// ── Site settings ─────────────────────────────────────────────────────────────

const EMPTY_SETTINGS: SiteSettings = {
  companyName: null,
  logoPath: null,
  contactEmail: CONTACT.email,
  phoneNumber: CONTACT.phone,
  address: CONTACT.address,
  footerDescription: null,
  whatsapp: CONTACT.whatsapp,
  socialLinks: [],
};

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOGUE_TAGS.settings);
  if (!hasSupabase()) return EMPTY_SETTINGS;

  const { data, error } = await createPublicClient().from("site_settings").select("setting_key, setting_value");
  if (error || !data) {
    logError("getSiteSettings", error);
    return EMPTY_SETTINGS;
  }
  const map = new Map(data.map((row) => [row.setting_key, row.setting_value]));
  const text = (key: string) => {
    const value = map.get(key);
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };
  const social = map.get("social_links");
  return {
    companyName: text("company_name"),
    logoPath: text("logo_path"),
    contactEmail: text("contact_email") ?? CONTACT.email,
    phoneNumber: text("phone_number") ?? CONTACT.phone,
    address: text("address") ?? CONTACT.address,
    footerDescription: text("footer_description"),
    whatsapp: text("whatsapp_number") ?? CONTACT.whatsapp,
    socialLinks: Array.isArray(social)
      ? social.filter(
          (s): s is { label: string; url: string } =>
            typeof s === "object" && s !== null && typeof (s as { url?: unknown }).url === "string" &&
            /^https:\/\//.test((s as { url: string }).url) && typeof (s as { label?: unknown }).label === "string",
        )
      : [],
  };
}
