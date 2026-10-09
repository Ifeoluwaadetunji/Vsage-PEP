import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();
    
    const { data: metrics, error } = await resend.emails.metrics({
      startDate: startDate.split('T')[0], // YYYY-MM-DD
      endDate: endDate.split('T')[0],
      dimensions: ['period'],
    });

    if (error) {
      console.error("[Metrics Error]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ metrics });
  } catch (error: any) {
    console.error("[Metrics Handler Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
