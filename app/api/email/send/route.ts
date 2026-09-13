import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendRateLimit } from "@/lib/security/ratelimit";
import { sanitizeEmailBody } from "@/lib/security/sanitize";
import { logAudit } from "@/lib/security/audit";

const applyBrandTemplate = (sanitizedContent: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body {
      background-color: #F7F5EF;
      color: #0D0F12;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
      background-color: #F7F5EF;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0D0F12;
      margin-top: 0;
    }
    a {
      color: #2F8F7A;
      text-decoration: none;
    }
    code, pre {
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
      background-color: #EBE8E0;
      padding: 2px 4px;
      border-radius: 4px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #5A6169;
      text-align: center;
    }
    .footer p {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      opacity: 0.65;
      font-size: 12px;
      color: #0D0F12;
      margin: 0;
    }
  </style>
</head>
<body style="background-color: #F7F5EF; color: #0D0F12; font-family: 'DM Sans', -apple-system, sans-serif; margin: 0; padding: 0; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="font-size: 16px;">
      ${sanitizedContent}
    </div>
    <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #5A6169; text-align: center;">
      <p style="font-family: 'DM Sans', -apple-system, sans-serif; text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px; color: #0D0F12; opacity: 0.65; margin: 0;">
        by vsage
      </p>
    </div>
  </div>
</body>
</html>
`;

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
      from: `"Vsage Tech" <${fromAddress}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: applyBrandTemplate(sanitizedHtml),
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
        from_address: `"Vsage Tech" <${fromAddress}>`,
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
