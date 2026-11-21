import type { Metadata } from "next";
import { FileText, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminCard, AdminHeader, EmptyState, FieldRow, StatusBadge, adminInput, dangerButton, primaryButton } from "@/features/admin/ui";
import { ActionForm, SubmitButton } from "@/features/admin/client-ui";
import { FileUploader } from "@/features/admin/components/file-uploader";
import { addCertification, deleteCertification, saveCertification } from "@/features/admin/actions/site";

export const metadata: Metadata = { title: "Certifications" };

export default async function AdminCertificationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("certifications")
    .select("id, title, description, document_path, document_type, issue_date, expiry_date, is_published, display_order")
    .order("display_order")
    .order("created_at");
  const certs = data ?? [];

  // Private bucket: admins get short-lived links to check the file.
  const { data: signed } = certs.length
    ? await supabase.storage.from("certifications").createSignedUrls(certs.map((c) => c.document_path), 600)
    : { data: [] };
  const links = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  return (
    <>
      <AdminHeader
        title="Certifications"
        description="Upload certificate documents (PDF or image). Only published ones appear on the Certifications page. The homepage badges are edited under Website content."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {certs.length === 0 ? (
            <EmptyState title="No certificates uploaded" text="Upload a certificate document with the form." />
          ) : (
            certs.map((c) => (
              <AdminCard key={c.id}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-slate-text" aria-hidden />
                    {links.get(c.document_path) ? (
                      <a href={links.get(c.document_path)!} target="_blank" rel="noreferrer" className="text-sm font-semibold text-navy-800 hover:underline">
                        Open {c.document_type === "pdf" ? "PDF" : "image"}
                      </a>
                    ) : (
                      <span className="text-sm text-slate-text">File</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={c.is_published ? "published" : "draft"} label={c.is_published ? "Published" : "Hidden"} />
                    <form action={deleteCertification}>
                      <input type="hidden" name="id" value={c.id} />
                      <SubmitButton className={`${dangerButton} h-8 px-2.5 text-xs`} confirm={`Delete “${c.title}” and its file?`}>
                        <Trash2 className="size-3.5" aria-hidden /> Delete
                      </SubmitButton>
                    </form>
                  </div>
                </div>
                <ActionForm action={saveCertification} className="grid gap-4 sm:grid-cols-2">
                  <input type="hidden" name="id" value={c.id} />
                  <FieldRow label="Title" className="sm:col-span-2">
                    <input name="title" required maxLength={200} defaultValue={c.title} className={`${adminInput} h-10`} />
                  </FieldRow>
                  <FieldRow label="Description" hint="optional" className="sm:col-span-2">
                    <textarea name="description" rows={2} maxLength={2000} defaultValue={c.description ?? ""} className={`${adminInput} py-2`} />
                  </FieldRow>
                  <FieldRow label="Issue date" hint="optional">
                    <input type="date" name="issueDate" defaultValue={c.issue_date ?? ""} className={`${adminInput} h-10`} />
                  </FieldRow>
                  <FieldRow label="Expiry date" hint="optional">
                    <input type="date" name="expiryDate" defaultValue={c.expiry_date ?? ""} className={`${adminInput} h-10`} />
                  </FieldRow>
                  <div className="flex flex-wrap items-center gap-6 text-sm sm:col-span-2">
                    <label className="flex items-center gap-2">
                      Order
                      <input type="number" name="displayOrder" min={0} max={9999} defaultValue={c.display_order} className={`${adminInput} h-9 w-20`} />
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="isPublished" defaultChecked={c.is_published} className="size-4 accent-navy-800" />
                      Published
                    </label>
                    <SubmitButton className={`${primaryButton} ml-auto`}>Save</SubmitButton>
                  </div>
                </ActionForm>
              </AdminCard>
            ))
          )}
        </div>

        <AdminCard title="Upload certificate">
          <FileUploader
            bucket="certifications"
            folder="new"
            kind="document"
            maxMb={10}
            withAlt
            altPlaceholder="Certificate title, e.g. ISO 13485 certificate"
            onUploaded={addCertification}
            label="Choose file"
          />
        </AdminCard>
      </div>
    </>
  );
}
