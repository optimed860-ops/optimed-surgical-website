import type { SpecificationEntry } from "@/types/database";

export type ImageRef = { path: string; alt: string | null };

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imagePath: string | null;
  productCount: number;
  subcategories: SubcategorySummary[];
};

export type SubcategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  productCode: string | null;
  shortDescription: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  image: ImageRef | null;
};

export type ProductDetail = ProductSummary & {
  manufacturer: string | null;
  description: string | null;
  specifications: SpecificationEntry[];
  images: ImageRef[];
  categoryId: string;
  subcategoryId: string | null;
  subcategoryName: string | null;
  subcategorySlug: string | null;
  updatedAt: string;
};

export type ProductPage = {
  items: ProductSummary[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
};

export type Certification = {
  id: string;
  title: string;
  description: string | null;
  documentType: "pdf" | "image";
  issueDate: string | null;
  expiryDate: string | null;
};

export type SiteSettings = {
  companyName: string | null;
  logoPath: string | null;
  contactEmail: string | null;
  phoneNumber: string | null;
  address: string | null;
  footerDescription: string | null;
  whatsapp: string | null;
  socialLinks: { label: string; url: string }[];
};
