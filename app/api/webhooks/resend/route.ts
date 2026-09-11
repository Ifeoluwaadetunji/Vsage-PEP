import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const payloadString = await req.text();
    const headersList = req.headers;
    
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
    // Attempt to insert into resend_events. If resend_event_id already exists, it will throw an error
    const { error: idempotencyError } = await supabase
      .from('resend_events')
      .insert({
        resend_event_id: resendEventId,
        event_type: eventType,
        payload: evt
      });

    if (idempotencyError) {
      // 23505 is PostgreSQL unique violation error code
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
        // Other events (e.g. email.opened, email.clicked) we might log but not update status
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
