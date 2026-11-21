import { NextResponse, connection } from "next/server";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { createSecretClient } from "@/lib/supabase/admin";

/**
 * Opens a published certification document.
 * The file lives in a PRIVATE bucket. We first confirm (as an anonymous visitor,
 * so RLS applies) that the document is published, then redirect to a signed URL
 * that expires after 60 seconds.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/certifications/[id]/download">) {
  await connection();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new NextResponse("Not found", { status: 404 });

  const { data: cert } = await createPublicClient()
    .from("certifications")
    .select("document_path")
    .eq("id", id)
    .maybeSingle();
  if (!cert) return new NextResponse("Not found", { status: 404 });

  const { data: signed, error } = await createSecretClient()
    .storage.from("certifications")
    .createSignedUrl(cert.document_path, 60);
  if (error || !signed) {
    console.error("[certifications] signed url failed", error?.message);
    return new NextResponse("Document unavailable", { status: 503 });
  }

  return NextResponse.redirect(signed.signedUrl, { status: 302, headers: { "Cache-Control": "private, no-store" } });
}
