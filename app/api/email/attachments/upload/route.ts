import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadRateLimit } from "@/lib/security/ratelimit";
import { isAttachmentSafe, generateSafeStorageKey } from "@/lib/security/attachmentGuard";
import { logAudit } from "@/lib/security/audit";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { success } = await uploadRateLimit.limit(user.id);
    if (!success) {
      await logAudit({
        userId: user.id,
        action: 'api.rate_limited',
        resource: 'attachment.upload'
      });
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const emailId = formData.get("email_id") as string;

    if (!file || !emailId) {
      return NextResponse.json({ error: "File and email_id are required" }, { status: 400 });
    }

    // Security check: Extension and MIME Type
    if (!isAttachmentSafe(file.name, file.type)) {
      return NextResponse.json({ error: "File type not allowed for security reasons" }, { status: 400 });
    }

    // Ensure user owns the email they are attaching to
    const { data: emailOwner } = await supabase
      .from('emails')
      .select('owner_id')
      .eq('id', emailId)
      .single();

    if (!emailOwner || emailOwner.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized for this email" }, { status: 403 });
    }

    // Generate safe S3/Storage key
    const storagePath = generateSafeStorageKey(user.id, file.name);

    // Upload to Supabase Storage (bucket: 'attachments')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[Storage Upload Error]", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Create DB record
    const { data: attachmentRecord, error: dbError } = await supabase
      .from('attachments')
      .insert({
        email_id: emailId,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        storage_path: uploadData.path
      })
      .select()
      .single();

    if (dbError) {
      console.error("[Attachment DB Error]", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, attachment: attachmentRecord });

  } catch (error: any) {
    console.error("[Attachment Upload Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
