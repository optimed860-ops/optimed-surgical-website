import type { MetadataRoute } from "next";
import { getAllProductSlugs, getCategories } from "@/features/catalogue/queries";
import { getPublishedPosts } from "@/features/blog/queries";

/** /sitemap.xml: submit this URL in Google Search Console. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const [categories, products, posts] = await Promise.all([getCategories(), getAllProductSlugs(), getPublishedPosts()]);

  const pages: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/products", priority: 0.9 },
    { path: "/quote", priority: 0.9 },
    { path: "/about", priority: 0.7 },
    { path: "/catalogue", priority: 0.7 },
    { path: "/certifications", priority: 0.6 },
    { path: "/contact", priority: 0.6 },
    { path: "/blog", priority: 0.7 },
    { path: "/privacy-policy", priority: 0.2 },
    { path: "/terms-and-conditions", priority: 0.2 },
    { path: "/image-credits", priority: 0.1 },
  ];

  return [
    ...pages.map((p) => ({ url: `${site}${p.path}`, changeFrequency: "weekly" as const, priority: p.priority })),
    ...categories.map((c) => ({ url: `${site}/categories/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${site}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...posts.map((p) => ({ url: `${site}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
