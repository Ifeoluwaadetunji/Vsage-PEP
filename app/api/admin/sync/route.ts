import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServiceClient();
    
    // 1. Get all resend_events for email.received
    const { data: events, error: eventsError } = await supabase
      .from('resend_events')
      .select('payload')
      .eq('event_type', 'email.received');
      
    if (eventsError) throw eventsError;
    
    let processed = 0;
    
    // 2. Iterate through events and update emails
    for (const event of events) {
      const payload = event.payload as any;
      if (!payload || !payload.data || !payload.data.email_id) continue;
      
      const emailId = payload.data.email_id;
      
      // Check if we have an email in our DB that matches the messageId or from/to and has empty body
      const { data: existingEmail } = await supabase
        .from('emails')
        .select('id, body_html')
        .eq('direction', 'inbound')
        .eq('from_address', payload.data.from)
        .limit(1)
        .single();
        
      if (existingEmail && !existingEmail.body_html) {
        // Fetch full email
        const { data: fullEmail } = await resend.emails.receiving.get(emailId);
        
        if (fullEmail) {
          await supabase.from('emails').update({
            body_html: fullEmail.html,
            body_text: fullEmail.text,
          }).eq('id', existingEmail.id);
          
          processed++;
          
          // Try to sync attachments too
          const { data: attachmentsRes } = await resend.emails.receiving.attachments.list({ emailId });
          const attachmentsList = attachmentsRes?.data;
          if (attachmentsList && attachmentsList.length > 0) {
            for (const att of attachmentsList) {
              await supabase.from('attachments').insert({
                email_id: existingEmail.id,
                filename: att.filename,
                mime_type: att.content_type,
                size_bytes: att.size || 0,
                storage_path: 'resend:pending'
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
