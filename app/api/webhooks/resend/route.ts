import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { createServiceClient } from "@/lib/supabase/server";

async function handleInboundEmail(payload: any) {
  const {
    from,
    to,
    subject,
    html,
    text,
    cc,
    bcc,
    messageId
  } = payload;

  if (!to || !from) {
    return new NextResponse("Missing 'to' or 'from' in payload", { status: 400 });
  }

  // Helper to ensure emails are arrays
  const toArray = Array.isArray(to) ? to : to.split(',').map((e: string) => e.trim());
  const ccArray = cc ? (Array.isArray(cc) ? cc : cc.split(',').map((e: string) => e.trim())) : [];
  const bccArray = bcc ? (Array.isArray(bcc) ? bcc : bcc.split(',').map((e: string) => e.trim())) : [];

  const extractEmail = (str: string) => {
    const match = str.match(/<([^>]+)>/);
    return match ? match[1] : str;
  };

  const recipientEmail = toArray.length > 0 ? extractEmail(toArray[0]) : null;
  
  if (!recipientEmail) {
    return new NextResponse("No recipient found", { status: 400 });
  }

  const supabase = await createServiceClient();

  // 1. Look up the profile owner_id by matching the recipient email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', recipientEmail)
    .single();

  if (profileError || !profile) {
    console.log(`[Inbound Webhook] Ignored email to ${recipientEmail} (User not found)`);
    return new NextResponse("User not found", { status: 200 });
  }

  const ownerId = profile.id;

  // 2. Insert into emails table
  const { error: insertError } = await supabase
    .from('emails')
    .insert({
      owner_id: ownerId,
      from_address: from,
      to_addresses: toArray,
      cc_addresses: ccArray,
      bcc_addresses: bccArray,
      subject: subject || "No Subject",
      body_html: html || "",
      body_text: text || "",
      direction: 'inbound',
      folder: 'inbox',
      is_read: false,
      send_status: 'delivered',
      message_id: messageId
    });

  if (insertError) {
    console.error("[Inbound Webhook DB Error]", insertError);
    return new NextResponse("Database Error", { status: 500 });
  }

  console.log(`[Inbound Webhook] Successfully received email for ${recipientEmail}`);
  return new NextResponse("Success", { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const payloadString = await req.text();
    const headersList = req.headers;
    
    // Check if this is an inbound email (Resend inbound webhooks don't use Svix)
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payloadString);
    } catch (e) {
      // Ignore parse error here, let Svix validation handle it if it's not JSON
    }

    if (parsedPayload && parsedPayload.from && parsedPayload.to && !parsedPayload.type) {
      // This looks like an inbound email payload from Resend
      return await handleInboundEmail(parsedPayload);
    }
    
    const svix_id = headersList.get("svix-id");
    const svix_timestamp = headersList.get("svix-timestamp");
    const svix_signature = headersList.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new NextResponse("Missing svix headers", { status: 400 });
    }

    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("RESEND_WEBHOOK_SECRET is missing");
      return new NextResponse("Internal Server Error", { status: 500 });
    }

    // 1. Verify Signature
    const wh = new Webhook(webhookSecret);
    let evt: any;
    
    try {
      evt = wh.verify(payloadString, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err: any) {
      console.error("[Webhook Verification Error]", err.message);
      return new NextResponse("Invalid signature", { status: 400 });
    }

    const { type: eventType, data } = evt;
    const resendEventId = svix_id;
    
    const supabase = await createServiceClient();

    // 2. Idempotency Check
    const { error: idempotencyError } = await supabase
      .from('resend_events')
      .insert({
        resend_event_id: resendEventId,
        event_type: eventType,
        payload: evt
      });

    if (idempotencyError) {
      if (idempotencyError.code === '23505') {
        console.log(`[Webhook] Duplicate event skipped: ${resendEventId}`);
        return new NextResponse("Duplicate event", { status: 200 });
      }
      console.error("[Webhook DB Error]", idempotencyError);
      return new NextResponse("Database Error", { status: 500 });
    }

    // 3. Process the event
    const emailId = data.email_id;
    if (!emailId) {
      return new NextResponse("Missing email_id in payload", { status: 400 });
    }

    let newStatus = 'pending';
    switch (eventType) {
      case 'email.sent':
        newStatus = 'sent';
        break;
      case 'email.delivered':
        newStatus = 'delivered';
        break;
      case 'email.bounced':
        newStatus = 'bounced';
        break;
      case 'email.complained':
        newStatus = 'complained';
        break;
      default:
        return new NextResponse("Event ignored", { status: 200 });
    }

    // 4. Update the emails table
    const { error: updateError } = await supabase
      .from('emails')
      .update({ send_status: newStatus })
      .eq('resend_id', emailId);

    if (updateError) {
      console.error("[Webhook Update Error]", updateError);
      return new NextResponse("Database Error", { status: 500 });
    }

    console.log(`[Webhook] Successfully processed ${eventType} for ${emailId}`);
    return new NextResponse("Success", { status: 200 });

  } catch (error: any) {
    console.error("[Webhook Handler Error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
