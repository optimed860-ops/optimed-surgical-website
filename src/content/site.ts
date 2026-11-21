/**
 * Website copy · Optimed
 * ──────────────────────
 * All editable marketing text lives here.
 *   - No invented statistics, years, client names or ratings.
 *   - Items marked `pendingClientReview` MUST be confirmed by the client before
 *     launch, especially certifications: only list marks the company really holds,
 *     with the exact registration/certificate numbers.
 * Contact details come from the database (site_settings), not from here.
 */

export const SITE = {
  name: "Optimed",
  legalName: "Optimed Surgical",
  tagline: "Inspiring Better Medicine.",
  description:
    "Optimed Surgical manufactures and supplies medical, surgical and dental instruments from Sialkot, Pakistan, since 2010. Standard, specialised and private-label instruments for hospitals, distributors and brands worldwide.",
} as const;

/**
 * Company contact details (supplied by the owner). Used everywhere unless the
 * admin panel later stores different values in site_settings.
 */
export const CONTACT = {
  phone: "+92 313 6764 367",
  email: "sales@optimedsurgical.com",
  address: "Gunna Kalan, Pasrur Road,\nSialkot 51310, Pakistan",
  // pendingClientReview: confirm this number is on WhatsApp.
  whatsapp: "923136764367",
} as const;

export const CONTACT_PAGE = {
  title: "Contact Optimed Surgical",
  intro: [
    "Optimed Surgical manufactures surgical, dental and medical instruments in Sialkot, Pakistan, for hospitals, clinics, distributors and healthcare brands worldwide. Send us your product list with quantities and our team will reply with a written quotation.",
    "Bulk and repeat orders get volume pricing. We quote tenders and line-item lists, offer private-label and custom manufacturing, and quote delivery to your destination.",
  ],
  why: [
    "Manufacturer since 2010, based in Sialkot",
    "Volume pricing on bulk and repeat orders",
    "Tenders and line-item lists quoted line by line",
    "Private-label and custom designs",
    "Certificates and specifications on request",
    "Worldwide delivery quoted to your destination",
  ],
  buyerTypes: [
    "Hospital / surgical centre",
    "Clinic / private practice",
    "Dental practice",
    "Distributor / wholesaler",
    "Importer / procurement agency",
    "Healthcare brand (private label)",
    "Other",
  ],
  payment: ["Bank transfer (T/T)", "Letter of credit (L/C)", "Purchase order", "To be discussed"],
} as const;

export const NAV = [
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/contact", label: "Contact" },
] as const;

export const HERO = {
  kicker: "Manufacturer since 2010 · Sialkot, Pakistan",
  titleLine1: "Precision instruments.",
  titleLine2: "Better outcomes.",
  lead: "Precision-engineered surgical, medical and dental instruments, manufactured for hospitals, distributors and brands across international markets.",
  points: ["Manufacturing since 2010", "Private-label & custom orders", "Worldwide supply"],
} as const;

export const FOOTER_TAGLINE = "Inspiring Better Medicine.";

export const HOME_ABOUT = {
  kicker: "About us",
  title: "Advancing surgical excellence since 2010.",
  text: "Optimed Surgical is a manufacturer and supplier of high-quality medical, surgical and dental instruments, headquartered in Sialkot, Pakistan. We combine skilled craftsmanship and technical expertise to serve hospitals, distributors and healthcare brands around the world.",
  features: [
    { icon: "shield", label: "Quality-led production" },
    { icon: "tag", label: "Private-label solutions" },
    { icon: "globe", label: "International supply" },
  ],
} as const;

/** Surgical disciplines listed under "What we make" (from the approved design). */
export const DISCIPLINES = [
  "General surgery",
  "Cardiovascular surgery",
  "ENT surgery",
  "Neurosurgery",
  "Gynaecology",
  "Ophthalmology",
  "Plastic surgery",
  "Orthopaedic surgery",
  "Laryngoscopes",
  "Liposuction and infiltration",
  "Cranio-maxillo-facial (CMF) surgery",
  "Retractors",
  "Electrosurgery instruments",
  "Dental surgery",
] as const;

export const MANUFACTURING = {
  title: "From raw material to ready-to-use precision.",
  // pendingClientReview: confirm the production steps.
  lead: "Every instrument follows the same controlled path, so each order arrives consistent, inspected and ready for use.",
  steps: [
    { title: "Material & preparation", text: "Medical-grade stainless steel selected and prepared for each instrument." },
    { title: "Precision manufacturing", text: "Forged, machined and fitted to the exact pattern and specification." },
    { title: "Inspection & quality control", text: "Dimensions, function and finish checked before approval." },
    { title: "Finishing & delivery", text: "Polished, marked, packed and dispatched to your destination." },
  ],
} as const;

/** Detailed production steps shown as hexagons. pendingClientReview: confirm the steps. */
export const MANUFACTURING_PROCESS = {
  title: "Our manufacturing process",
  intro:
    "Every order starts with carefully selected medical-grade stainless steel. Each piece is cut, forged and machined to exact specifications, then fitted, heat-treated and polished by skilled craftsmen in Sialkot. Before packing, every instrument passes a final quality inspection, so you receive surgical and dental instruments that are precise, consistent and ready for use.",
  steps: [
    { title: "Steel cutting", icon: "cut" },
    { title: "Forging & hammering", icon: "forge" },
    { title: "Milling", icon: "mill" },
    { title: "Fitting", icon: "fit" },
    { title: "Heat treatment", icon: "heat" },
    { title: "Electro polishing", icon: "polish" },
    { title: "Laser marking", icon: "laser" },
    { title: "Final QC inspection", icon: "qc" },
    { title: "Packing & labelling", icon: "pack" },
    { title: "Dispatch", icon: "ship" },
  ],
} as const;

export const HOW_IT_WORKS = {
  title: "How it works",
  text: "A simple process to get the solutions you need.",
  steps: [
    {
      title: "Request a catalogue / share product codes",
      text: "Tell us which disciplines you work in, or send the item codes and quantities you already know.",
      icon: "book",
    },
    {
      title: "Discuss requirements / product selection",
      text: "Our team confirms specifications, materials, marking and packaging with you.",
      icon: "chat",
    },
    {
      title: "Receive a quotation / coordinate next steps",
      text: "You get a written quotation, then we plan production and delivery together.",
      icon: "file",
    },
  ],
} as const;

/**
 * Trust marks shown under the hero and in the certificates section.
 * pendingClientReview: confirm each one is genuinely held, and add numbers.
 * Wording matters legally: FDA *registered* (not "approved"), *CE marked*.
 */
export const CERTIFICATIONS = [
  { mark: "ISO 13485", short: "Medical devices QMS", name: "ISO 13485", detail: "Quality management for medical devices", number: null },
  { mark: "ISO 9001", short: "Quality management", name: "ISO 9001", detail: "Quality management system", number: null },
  { mark: "CE", short: "Marked", name: "CE", detail: "European conformity marking", number: null },
  { mark: "FDA", short: "Registered", name: "US FDA", detail: "Establishment registration", number: null },
  { mark: "EU MDR", short: "Compliant", name: "EU MDR", detail: "EU Medical Device Regulation documentation", number: null },
] as const satisfies readonly {
  mark: string;
  short: string;
  name: string;
  detail: string;
  number: string | null;
}[];

export const ABOUT = {
  title: "Advancing surgical excellence since 2010",
  intro:
    "Founded in 2010, Optimed Surgical is a manufacturer and supplier of high-quality medical, surgical and dental instruments, headquartered in Sialkot, Pakistan.",
  paragraphs: [
    "We serve healthcare professionals, medical distributors, hospitals and healthcare organisations across international markets, providing precision-engineered products and comprehensive manufacturing solutions.",
    "Built on years of manufacturing experience, skilled craftsmanship and technical expertise, we combine established manufacturing capabilities with continuous improvement to meet the evolving demands of the global healthcare industry.",
  ],
  facts: [
    { value: "2010", label: "founded in Sialkot, Pakistan" },
    { value: "Full range", label: "standard, specialised and custom instruments" },
    { value: "Private label", label: "custom designs and specifications" },
    { value: "Worldwide", label: "distributors, hospitals and brands" },
  ],
  pillars: [
    {
      title: "Extensive portfolio",
      text: "A diverse range of standard and specialised instruments, complemented by customised manufacturing and private-label solutions tailored to your designs and specifications.",
    },
    {
      title: "Quality, precision, reliability",
      text: "From material selection and product development to manufacturing and final inspection, we focus on dimensional accuracy, workmanship and product consistency.",
    },
    {
      title: "Partnership approach",
      text: "Flexible manufacturing arrangements, competitive value and dependable supply for distributors, healthcare suppliers and established brands, backed by responsive communication.",
    },
  ],
  closing:
    "Through our commitment to manufacturing excellence, innovation and continuous development, Optimed Surgical continues to strengthen its presence in the global healthcare industry, delivering products and solutions that reflect our dedication to quality and professional integrity.",
} as const;

export const WHAT_WE_MAKE = {
  title: "What we make",
  lead: "From general surgery to dental, ENT and electrosurgery, we manufacture standard, specialised and custom instruments across every discipline. Request the catalogue or tell us the codes you need.",
} as const;

/** The order process. A real sequence, so it is numbered. */
export const PROCESS = [
  { title: "Send your requirements", text: "Choose products or type item codes and quantities.", icon: "clipboard" },
  { title: "Receive a quotation", text: "We price your order for the quantities and destination.", icon: "file" },
  { title: "Confirm your order", text: "Agree specifications, marking, packing and delivery.", icon: "handshake" },
  { title: "Quality inspection", text: "Every lot is checked before it is packed.", icon: "shield" },
  { title: "Packing & dispatch", text: "Labelled, packed and shipped to your destination.", icon: "truck" },
] as const;

export const CERTIFICATES_SECTION = {
  title: "Certified for the markets you serve",
  // pendingClientReview: confirm these standards before launch.
  text: "Our production follows ISO 13485, ISO 9001 and CE requirements, with documentation that supports buyers in regulated markets. Request our current certificates and registrations at any time.",
} as const;

/** pendingClientReview: confirm every answer before launch. */
export const FAQ = [
  {
    q: "What types of medical and surgical products do you supply?",
    a: "We manufacture medical, surgical and dental instruments across all major disciplines, from general and cardiovascular surgery to ENT, neurosurgery, orthopaedics and dental surgery, in both standard and specialised patterns.",
  },
  {
    q: "Where are you located?",
    a: "Our facility is at Gunna Kalan, Pasrur Road, Sialkot 51310, Pakistan. Sialkot is one of the world’s best-known centres for surgical instrument manufacturing.",
  },
  {
    q: "How long have you been manufacturing?",
    a: "Optimed Surgical was founded in 2010. Since then we have supplied hospitals, distributors and healthcare brands in international markets.",
  },
  {
    q: "Do you handle international import and export inquiries?",
    a: "Yes. We supply buyers across international markets. Include your country in your request so we can quote delivery to your destination.",
  },
  {
    q: "How can I request a catalogue?",
    a: "Fill in the short form on the Catalogue page and tell us which disciplines or products you need. Our team will send you the matching catalogue.",
  },
  {
    q: "Can I request specific product codes?",
    a: "Yes. Type the item codes and quantities you need on the quote or catalogue form, one per line, and we’ll quote them for you.",
  },
  {
    q: "Do you offer private-label or custom manufacturing?",
    a: "Yes. We manufacture instruments to your own designs, drawings and specifications, and supply them under your brand with your marking and packaging.",
  },
  {
    q: "What materials are your instruments made from?",
    a: "Our instruments are made from medical-grade stainless steel. If you need a specific material, finish or grade, mention it in your request.",
  },
  {
    q: "How can I obtain certificates and regulatory documents?",
    a: "Use “Request certificates” or mention the documents you need in your quote request. We’ll send our current certificates and registrations.",
  },
  {
    q: "Is there a minimum order quantity?",
    a: "Quantities are agreed per quotation. Tell us what you need and we’ll confirm what’s possible.",
  },
  {
    q: "How do I place an order?",
    a: "Send a quote request with your products and quantities. Once you approve our written quotation, we confirm specifications and arrange production and delivery with you.",
  },
] as const;

export const QUOTE_PAGE = {
  title: "Request a quote",
  lead:
    "Send us the products and quantities you need. Pick items from our catalogue or type item codes yourself. Our team reviews every request and replies with a written quotation.",
  why: [
    "Written quotation for your exact quantities",
    "Pricing for bulk and repeat orders",
    "Tenders and line-item lists welcome",
    "Certificates and specifications on request",
    "International delivery quoted to your destination",
  ],
  whoWeSupply: [
    "Hospitals and surgical centres",
    "Clinics and private practices",
    "Dental practices",
    "Medical distributors and wholesalers",
    "Importers and procurement agencies",
  ],
  steps: [
    { title: "Send your list", text: "Products from the catalogue, or item codes and quantities typed in." },
    { title: "Get a written quote", text: "Our team checks your request and replies with a quotation." },
    { title: "Confirm and ship", text: "Approve the quote and we arrange production or supply and dispatch." },
  ],
} as const;

export const CATALOGUE_PAGE = {
  title: "Request our catalogue",
  lead:
    "Our full range is larger than what you see online. Tell us what you’re looking for and we’ll send the catalogue that matches your needs.",
  receive: [
    "The catalogue for the product groups you choose",
    "Item codes you can use in your quotation request",
    "Specifications and documentation on request",
  ],
} as const;

export const FINAL_CTA = {
  title: "Ready to source your next order?",
  text: "Request the full catalogue, or send us your list for a quotation.",
} as const;
