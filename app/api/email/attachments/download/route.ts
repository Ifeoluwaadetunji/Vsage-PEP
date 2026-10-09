import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { downloadRateLimit } from "@/lib/security/ratelimit";
import { logAudit } from "@/lib/security/audit";
import { resend } from "@/lib/resend";

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

    // Get attachment and its parent email record
    const { data: attachment, error: dbError } = await supabase
      .from('attachments')
      .select('filename, email_id, storage_path, emails!inner(direction, resend_id)')
      .eq('id', attachmentId)
      .single();

    if (dbError || !attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const email = Array.isArray(attachment.emails) ? attachment.emails[0] : attachment.emails;
    
    // If it has a Supabase storage path (legacy), generate a signed URL
    if (attachment.storage_path && !attachment.storage_path.startsWith('resend:')) {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("attachments")
        .createSignedUrl(attachment.storage_path, 60, {
          download: attachment.filename
        });
        
      if (!signedUrlError && signedUrlData) {
        return NextResponse.json({ success: true, url: signedUrlData.signedUrl });
      }
    }

    if (!email.resend_id) {
      return NextResponse.json({ error: "Email provider ID missing" }, { status: 404 });
    }

    // Use Resend SDK to get the download URL dynamically
    let resendAttachments;
    if (email.direction === 'inbound') {
      const { data } = await resend.emails.receiving.attachments.list({ emailId: email.resend_id });
      resendAttachments = data;
    } else {
      const { data } = await resend.emails.attachments.list({ emailId: email.resend_id });
      resendAttachments = data;
    }

    const targetAttachment = resendAttachments?.find(a => a.filename === attachment.filename);
    
    if (!targetAttachment) {
      return NextResponse.json({ error: "Attachment not found in provider" }, { status: 404 });
    }

    let downloadUrl;
    if (email.direction === 'inbound') {
      const { data } = await resend.emails.receiving.attachments.get({ id: targetAttachment.id, emailId: email.resend_id });
      downloadUrl = data?.download_url;
    } else {
      const { data } = await resend.emails.attachments.get({ id: targetAttachment.id, emailId: email.resend_id });
      downloadUrl = data?.download_url;
    }

    if (!downloadUrl) {
      return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
    }

    await logAudit({
      userId: user.id,
      action: 'attachment.downloaded',
      resource: attachmentId,
      metadata: { filename: attachment.filename }
    });

    return NextResponse.json({ success: true, url: downloadUrl });

  } catch (error: any) {
    console.error("[Attachment Download Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
