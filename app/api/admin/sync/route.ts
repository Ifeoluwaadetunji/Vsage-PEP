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
          const { data: attachmentsList } = await resend.emails.receiving.attachments.list({ emailId });
          if (attachmentsList && attachmentsList.length > 0) {
            for (const att of attachmentsList) {
              const { data: attData } = await resend.emails.receiving.attachments.get({ id: att.id, emailId });
              if (attData?.download_url) {
                const fileRes = await fetch(attData.download_url);
                if (fileRes.ok) {
                  const buffer = await fileRes.arrayBuffer();
                  const storagePath = `sync/${Date.now()}-${att.filename?.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                  const { data: uploadData } = await supabase.storage.from("attachments").upload(storagePath, buffer, {
                    contentType: att.content_type || 'application/octet-stream'
                  });
                  if (uploadData) {
                    await supabase.from('attachments').insert({
                      email_id: existingEmail.id,
                      filename: att.filename,
                      mime_type: att.content_type,
                      size_bytes: buffer.byteLength,
                      storage_path: uploadData.path
                    });
                  }
                }
              }
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
