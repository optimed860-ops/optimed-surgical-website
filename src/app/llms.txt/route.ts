import { getCategories } from "@/features/catalogue/queries";
import { getPublishedPosts } from "@/features/blog/queries";
import { getSiteSettings } from "@/features/catalogue/queries";
import { SITE } from "@/content/site";

/**
 * /llms.txt: a plain-text summary of the site for AI assistants and answer
 * engines (the llms.txt convention). Built from live, published data only.
 */
export async function GET() {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const [categories, posts, settings] = await Promise.all([getCategories(), getPublishedPosts(), getSiteSettings()]);

  const lines = [
    `# ${SITE.legalName}`,
    "",
    `> ${SITE.description}`,
    "",
    "Prices are not published online. Buyers send a product list with quantities and receive a written quotation.",
    "",
    "## Contact",
    settings.contactEmail ? `- Email: ${settings.contactEmail}` : null,
    settings.phoneNumber ? `- Phone: ${settings.phoneNumber}` : null,
    settings.address ? `- Address: ${settings.address.replace(/\s*\n\s*/g, ", ")}` : null,
    "",
    "## Main pages",
    `- [Products](${site}/products): instrument range by category`,
    `- [Request a quote](${site}/quote): send item lists and quantities`,
    `- [Catalogue](${site}/catalogue): request the full catalogue`,
    `- [About](${site}/about): company and manufacturing`,
    `- [Certifications](${site}/certifications)`,
    `- [Contact](${site}/contact)`,
    `- [Blog](${site}/blog): instrument guides and buying advice`,
    "",
    categories.length ? "## Product categories" : null,
    ...categories.map((c) => `- [${c.name}](${site}/categories/${c.slug})${c.description ? `: ${c.description}` : ""}`),
    "",
    posts.length ? "## Articles" : null,
    ...posts.slice(0, 30).map((p) => `- [${p.title}](${site}/blog/${p.slug}): ${p.excerpt}`),
    "",
  ].filter((l) => l !== null);

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
