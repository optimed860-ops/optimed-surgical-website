/**
 * Editable website content.
 * DEFAULT_CONTENT is built from src/content/site.ts. Admins override any part
 * of it in Admin → Website content; overrides are stored in
 * site_settings.site_content and merged over these defaults by mergeShape().
 */
import {
  ABOUT,
  CATALOGUE_PAGE,
  CERTIFICATES_SECTION,
  CERTIFICATIONS,
  CONTACT_PAGE,
  DISCIPLINES,
  FAQ,
  FOOTER_TAGLINE,
  HERO,
  HOME_ABOUT,
  HOW_IT_WORKS,
  MANUFACTURING_PROCESS,
  QUOTE_PAGE,
  WHAT_WE_MAKE,
} from "./site";

export const DEFAULT_CONTENT = {
  hero: HERO,
  homeAbout: HOME_ABOUT,
  whatWeMake: { ...WHAT_WE_MAKE, disciplines: [...DISCIPLINES] },
  manufacturing: MANUFACTURING_PROCESS,
  howItWorks: HOW_IT_WORKS,
  certificates: { ...CERTIFICATES_SECTION, items: CERTIFICATIONS },
  faq: FAQ,
  aboutPage: ABOUT,
  quotePage: QUOTE_PAGE,
  cataloguePage: CATALOGUE_PAGE,
  contactPage: CONTACT_PAGE,
  footer: {
    tagline: FOOTER_TAGLINE,
    description: "Medical, surgical and dental instruments from Sialkot, Pakistan. Manufacturing since 2010.",
  },
};

/** Turns literal `as const` types into plain editable types. */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends null
        ? string | null
        : T extends readonly (infer U)[]
          ? Widen<U>[]
          : T extends object
            ? { -readonly [K in keyof T]: Widen<T[K]> }
            : T;

export type SiteContent = Widen<typeof DEFAULT_CONTENT>;

/** Human-readable section names for the admin editor. */
export const CONTENT_SECTIONS: { key: keyof SiteContent; label: string; page: string }[] = [
  { key: "hero", label: "Hero (top of homepage)", page: "Home" },
  { key: "homeAbout", label: "About section", page: "Home" },
  { key: "whatWeMake", label: "What we make", page: "Home" },
  { key: "manufacturing", label: "Manufacturing process", page: "Home & About" },
  { key: "howItWorks", label: "How it works", page: "Home" },
  { key: "certificates", label: "Certifications", page: "Home & About" },
  { key: "faq", label: "Frequently asked questions", page: "Home, Quote, Contact" },
  { key: "aboutPage", label: "About page", page: "About" },
  { key: "quotePage", label: "Request a quote: title, steps, who we supply", page: "Quote" },
  { key: "cataloguePage", label: "Catalogue page", page: "Catalogue" },
  { key: "contactPage", label: "Request a quote: intro, why us, form choices", page: "Quote" },
  { key: "footer", label: "Footer", page: "All pages" },
];

const MAX_TEXT = 8000;
const MAX_LIST = 60;

/** A copy of `value` with every string emptied (template for new list items). */
export function blankOf<T>(value: T): T {
  if (typeof value === "string") return "" as T;
  if (value === null) return null as T;
  if (Array.isArray(value)) return [] as T;
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, blankOf(v)])) as T;
  }
  return value;
}

function hasText(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasText);
  if (value && typeof value === "object") return Object.values(value).some(hasText);
  return false;
}

/**
 * Merges untrusted `override` over `defaults`, keeping exactly the defaults' shape:
 * unknown keys are dropped, wrong types fall back to the default, empty text in
 * an object field means "use the default", strings are length-capped.
 * Lists are replaced as a whole (empty items removed; an empty list means default).
 */
export function mergeShape<T>(defaults: T, override: unknown): T {
  if (typeof defaults === "string") {
    return (typeof override === "string" && override.trim() ? override.slice(0, MAX_TEXT) : defaults) as T;
  }
  if (defaults === null) {
    return (typeof override === "string" && override.trim() ? override.trim().slice(0, 200) : null) as T;
  }
  if (typeof defaults === "number" || typeof defaults === "boolean") {
    return (typeof override === typeof defaults ? override : defaults) as T;
  }
  if (Array.isArray(defaults)) {
    if (!Array.isArray(override) || defaults.length === 0) return defaults;
    const template = defaults[0];
    const items = override
      .slice(0, MAX_LIST)
      .map((item) => (typeof template === "string" ? (typeof item === "string" ? item.trim().slice(0, MAX_TEXT) : "") : mergeItem(template, item)))
      .filter(hasText);
    return (items.length > 0 ? items : defaults) as T;
  }
  if (typeof defaults === "object" && defaults !== null) {
    const source = override && typeof override === "object" && !Array.isArray(override) ? (override as Record<string, unknown>) : {};
    return Object.fromEntries(
      Object.entries(defaults).map(([key, value]) => [key, mergeShape(value, source[key])]),
    ) as T;
  }
  return defaults;
}

/** List item: same shape as the template, but empty text stays empty. */
function mergeItem<T>(template: T, item: unknown): T {
  if (typeof template === "string") return (typeof item === "string" ? item.slice(0, MAX_TEXT) : "") as T;
  if (template === null) return (typeof item === "string" && item.trim() ? item.trim().slice(0, 200) : null) as T;
  if (Array.isArray(template)) return mergeShape(template, item);
  if (typeof template === "object" && template !== null) {
    const source = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return Object.fromEntries(Object.entries(template).map(([k, v]) => [k, mergeItem(v, source[k])])) as T;
  }
  return template;
}

export function mergeContent(override: unknown): SiteContent {
  return mergeShape(DEFAULT_CONTENT as unknown as SiteContent, override);
}
