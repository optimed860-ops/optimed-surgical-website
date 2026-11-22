/**
 * Database types for supabase-js, written to match supabase/migrations.
 * If you later use the Supabase CLI, this file can be regenerated with:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 * Keep it in sync whenever a migration changes a table.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Rel<Name extends string, Col extends string, Ref extends string, RefCol extends string = "id"> = {
  foreignKeyName: Name;
  columns: [Col];
  isOneToOne: false;
  referencedRelation: Ref;
  referencedColumns: [RefCol];
};

/** Insert = required columns + optional rest; Update = everything optional. */
type TableDef<Row, Required extends keyof Row, Relationships extends unknown[] = []> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

export type SpecificationEntry = { label: string; value: string };

export type AdminRow = {
  user_id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type SubcategoryRow = CategoryRow & { category_id: string };

export type ProductRow = {
  id: string;
  category_id: string;
  subcategory_id: string | null;
  name: string;
  slug: string;
  product_code: string | null;
  manufacturer: string | null;
  short_description: string | null;
  description: string | null;
  specifications: Json;
  is_featured: boolean;
  featured_order: number;
  is_published: boolean;
  search_vector: unknown;
  created_at: string;
  updated_at: string;
};

export type ProductImageRow = {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
};

export type QuotationRow = {
  id: string;
  reference_number: string;
  submission_key: string;
  customer_name: string;
  company_name: string;
  business_email: string;
  phone_number: string;
  country: string;
  additional_message: string | null;
  status: string;
  internal_notes: string | null;
  requested_items_text: string | null;
  created_at: string;
  updated_at: string;
};

export type InquiryRow = {
  id: string;
  reference_number: string;
  submission_key: string;
  inquiry_type: "catalogue" | "contact";
  customer_name: string;
  company_name: string | null;
  email: string;
  phone_number: string | null;
  country: string | null;
  product_interest: string | null;
  requested_items_text: string | null;
  message: string | null;
  status: "new" | "in_progress" | "closed";
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type QuotationItemRow = {
  id: string;
  quotation_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  product_code_snapshot: string | null;
  quantity: number;
  created_at: string;
};

export type OrderRow = {
  id: string;
  order_reference: string;
  internal_reference: string | null;
  quotation_id: string | null;
  customer_name: string;
  company_name: string;
  customer_email: string;
  phone_number: string | null;
  country: string | null;
  status: string;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  product_code_snapshot: string | null;
  quantity: number;
  created_at: string;
};

export type OrderUpdateRow = {
  id: string;
  order_id: string;
  status: string;
  message: string | null;
  created_by: string | null;
  created_at: string;
};

export type CertificationRow = {
  id: string;
  title: string;
  description: string | null;
  document_path: string;
  document_type: "pdf" | "image";
  issue_date: string | null;
  expiry_date: string | null;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type SiteSettingRow = {
  setting_key: string;
  setting_value: Json | null;
  is_public: boolean;
  updated_at: string;
};

export type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  seo_title: string | null;
  seo_description: string | null;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  author_name: string;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DashboardMetrics = {
  total_products: number;
  published_products: number;
  total_quotations: number;
  new_quotations: number;
  active_orders: number;
  total_orders: number;
  new_inquiries: number;
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "13" };
  public: {
    Tables: {
      admins: TableDef<AdminRow, "user_id">;
      categories: TableDef<CategoryRow, "name" | "slug">;
      subcategories: TableDef<
        SubcategoryRow,
        "category_id" | "name" | "slug",
        [Rel<"subcategories_category_id_fkey", "category_id", "categories">]
      >;
      products: TableDef<
        Omit<ProductRow, "search_vector"> & { search_vector: unknown },
        "category_id" | "name" | "slug",
        [
          Rel<"products_category_id_fkey", "category_id", "categories">,
          Rel<"products_subcategory_id_fkey", "subcategory_id", "subcategories">,
        ]
      >;
      product_images: TableDef<
        ProductImageRow,
        "product_id" | "storage_path",
        [Rel<"product_images_product_id_fkey", "product_id", "products">]
      >;
      quotations: TableDef<
        QuotationRow,
        "submission_key" | "customer_name" | "company_name" | "business_email" | "phone_number" | "country"
      >;
      quotation_items: TableDef<
        QuotationItemRow,
        "quotation_id" | "product_name_snapshot" | "quantity",
        [
          Rel<"quotation_items_quotation_id_fkey", "quotation_id", "quotations">,
          Rel<"quotation_items_product_id_fkey", "product_id", "products">,
        ]
      >;
      orders: TableDef<
        OrderRow,
        "customer_name" | "company_name" | "customer_email",
        [Rel<"orders_quotation_id_fkey", "quotation_id", "quotations">]
      >;
      order_items: TableDef<
        OrderItemRow,
        "order_id" | "product_name_snapshot" | "quantity",
        [
          Rel<"order_items_order_id_fkey", "order_id", "orders">,
          Rel<"order_items_product_id_fkey", "product_id", "products">,
        ]
      >;
      order_updates: TableDef<
        OrderUpdateRow,
        "order_id" | "status",
        [Rel<"order_updates_order_id_fkey", "order_id", "orders">]
      >;
      certifications: TableDef<CertificationRow, "title" | "document_path" | "document_type">;
      site_settings: TableDef<SiteSettingRow, "setting_key">;
      inquiries: TableDef<InquiryRow, "submission_key" | "inquiry_type" | "customer_name" | "email">;
      blog_posts: TableDef<BlogPostRow, "title" | "slug" | "excerpt" | "body">;
    };
    Views: { [_ in never]: never };
    Functions: {
      submit_quotation: { Args: { p_payload: Json; p_key_hash: string }; Returns: Json };
      submit_inquiry: { Args: { p_payload: Json; p_key_hash: string }; Returns: Json };
      check_login_rate_limit: { Args: { p_key_hash: string }; Returns: boolean };
      create_order: { Args: { p_payload: Json }; Returns: string };
      add_order_update: {
        Args: { p_order_id: string; p_status: string; p_message: string };
        Returns: string;
      };
      dashboard_metrics: { Args: Record<PropertyKey, never>; Returns: Json };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
