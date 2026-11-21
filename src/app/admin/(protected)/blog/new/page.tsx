import type { Metadata } from "next";
import { AdminHeader } from "@/features/admin/ui";
import { BlogForm } from "@/features/admin/components/blog-form";

export const metadata: Metadata = { title: "New article" };

export default function NewBlogPostPage() {
  return (
    <>
      <AdminHeader title="New article" description="A cover image can be added after the article is created." back={{ href: "/admin/blog", label: "Blog" }} />
      <div className="max-w-4xl">
        <BlogForm />
      </div>
    </>
  );
}
