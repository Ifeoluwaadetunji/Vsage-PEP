import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { downloadRateLimit } from "@/lib/security/ratelimit";
import { logAudit } from "@/lib/security/audit";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { success } = await downloadRateLimit.limit(user.id);
    if (!success) {
      await logAudit({
        userId: user.id,
        action: 'api.rate_limited',
        resource: 'attachment.download'
      });
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get("id");

    if (!attachmentId) {
      return NextResponse.json({ error: "Attachment ID is required" }, { status: 400 });
    }

    // Get attachment record (RLS ensures user can only see their own email's attachments)
    const { data: attachment, error: dbError } = await supabase
      .from('attachments')
      .select('storage_path, filename')
      .eq('id', attachmentId)
      .single();

    if (dbError || !attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Generate short-lived signed URL for download (expires in 60 seconds)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("attachments")
      .createSignedUrl(attachment.storage_path, 60, {
        download: attachment.filename
      });

    if (signedUrlError) {
      console.error("[Signed URL Error]", signedUrlError);
      return NextResponse.json({ error: "Failed to generate download link" }, { status: 500 });
    }

    // Audit Log
    await logAudit({
      userId: user.id,
      action: 'attachment.downloaded',
      resource: attachmentId,
      metadata: { filename: attachment.filename }
    });

    return NextResponse.json({ success: true, url: signedUrlData.signedUrl });

  } catch (error: any) {
    console.error("[Attachment Download Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
