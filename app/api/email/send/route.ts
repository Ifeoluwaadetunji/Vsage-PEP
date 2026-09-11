import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendRateLimit } from "@/lib/security/ratelimit";
import { sanitizeEmailBody } from "@/lib/security/sanitize";
import { logAudit } from "@/lib/security/audit";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate limit check (using user ID)
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success, limit, remaining } = await sendRateLimit.limit(user.id);
    
    if (!success) {
      await logAudit({
        userId: user.id,
        action: 'api.rate_limited',
        resource: 'email.send',
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") || undefined
      });
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // 3. Validate Payload
    const body = await req.json();
    const { to, subject, html, text, cc, bcc } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 4. Fetch sender info
    const serviceRole = await createServiceClient();
    const { data: profile } = await serviceRole
      .from('profiles')
      .select('email, is_active')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_active) {
      return NextResponse.json({ error: "Account suspended or not found" }, { status: 403 });
    }

    const fromAddress = profile.email;
    const sanitizedHtml = sanitizeEmailBody(html || "");

    // 5. Send via Resend
    const resendPayload: any = {
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: sanitizedHtml,
      text: text || "",
    };

    if (cc) resendPayload.cc = Array.isArray(cc) ? cc : [cc];
    if (bcc) resendPayload.bcc = Array.isArray(bcc) ? bcc : [bcc];

    const { data: resendData, error: resendError } = await resend.emails.send(resendPayload);

    if (resendError) {
      console.error("[Resend Error]", resendError);
      return NextResponse.json({ error: "Failed to send email through provider" }, { status: 500 });
    }

    // 6. Save to Supabase DB (outbound, pending delivery)
    const { data: emailRecord, error: dbError } = await serviceRole
      .from('emails')
      .insert({
        owner_id: user.id,
        from_address: fromAddress,
        to_addresses: resendPayload.to,
        cc_addresses: resendPayload.cc || [],
        bcc_addresses: resendPayload.bcc || [],
        subject: subject,
        body_html: sanitizedHtml,
        body_text: text || "",
        direction: 'outbound',
        folder: 'sent',
        is_read: true,
        send_status: 'pending',
        resend_id: resendData?.id
      })
      .select('id')
      .single();

    if (dbError) {
      console.error("[DB Error]", dbError);
      // We don't fail the request here, email is sent, just missing from outbox
    }

    // 7. Audit log
    await logAudit({
      userId: user.id,
      action: 'email.sent',
      resource: resendData?.id,
      ipAddress: ip,
      metadata: { to: resendPayload.to }
    });

    return NextResponse.json({ 
      success: true, 
      id: resendData?.id,
      db_id: emailRecord?.id 
    });

  } catch (error: any) {
    console.error("[Send Email Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
