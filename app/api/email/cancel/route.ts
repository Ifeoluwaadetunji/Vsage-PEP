import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing email id" }, { status: 400 });
    }

    const serviceRole = await createServiceClient();

    // Verify ownership
    const { data: emailRecord } = await serviceRole
      .from('emails')
      .select('resend_id')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (!emailRecord || !emailRecord.resend_id) {
      return NextResponse.json({ error: "Email not found or already sent" }, { status: 404 });
    }

    // Cancel in Resend
    const { error: cancelError } = await resend.emails.cancel(emailRecord.resend_id);
    
    if (cancelError) {
      console.error("[Cancel Error]", cancelError);
      return NextResponse.json({ error: "Could not cancel email" }, { status: 500 });
    }

    // Delete or mark as draft in Supabase
    // To allow the user to keep editing it, we could move it back to drafts.
    await serviceRole
      .from('emails')
      .update({
        folder: 'drafts',
        send_status: 'cancelled',
        is_draft: true
      })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Cancel Handler Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
