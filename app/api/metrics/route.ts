import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();
    
    const supabase = await createServiceClient();

    const { data: emailsData, error } = await supabase
      .from('emails')
      .select('created_at, direction, send_status')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) {
      console.error("[Metrics Error]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const metricsMap: Record<string, any> = {};

    // Initialize all days in range
    let current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      metricsMap[dateStr] = {
        timestamp: current.toISOString(),
        metrics: { sent: 0, delivered: 0, bounced: 0, received: 0 }
      };
      current.setDate(current.getDate() + 1);
    }

    if (emailsData) {
      emailsData.forEach((email: any) => {
        const dateStr = new Date(email.created_at).toISOString().split('T')[0];
        if (metricsMap[dateStr]) {
          if (email.direction === 'inbound') {
            metricsMap[dateStr].metrics.received++;
          } else if (email.direction === 'outbound') {
            metricsMap[dateStr].metrics.sent++;
            if (email.send_status === 'delivered') metricsMap[dateStr].metrics.delivered++;
            if (email.send_status === 'bounced') metricsMap[dateStr].metrics.bounced++;
          }
        }
      });
    }

    const metrics = Object.values(metricsMap);
    return NextResponse.json({ metrics });
  } catch (error: any) {
    console.error("[Metrics Handler Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
