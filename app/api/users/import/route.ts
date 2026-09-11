import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Papa from "papaparse";
import { logAudit } from "@/lib/security/audit";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Must be admin to import users
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file || !file.name.endsWith('.csv')) {
      return NextResponse.json({ error: "A valid CSV file is required" }, { status: 400 });
    }

    const csvText = await file.text();
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json({ error: "Invalid CSV format", details: parsed.errors }, { status: 400 });
    }

    const rows = parsed.data as any[];
    const serviceRole = await createServiceClient();
    
    let successful = 0;
    let failed = 0;
    const errors = [];

    // Process sequentially to avoid Supabase rate limits on Admin API
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const email = row.email?.trim();
      const fullName = row.full_name?.trim();
      const role = row.role?.trim().toLowerCase() === 'admin' ? 'admin' : 'user';

      if (!email || !fullName) {
        failed++;
        errors.push({ row: i + 1, error: 'Missing required fields (email, full_name)' });
        continue;
      }

      // Generate a temporary random password
      const tempPassword = Math.random().toString(36).slice(-12) + "Aa1!";

      // Use Supabase Admin API to create user, skipping email confirmation for immediate access
      const { data: newUser, error: createError } = await serviceRole.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName
        }
      });

      if (createError) {
        failed++;
        errors.push({ row: i + 1, email, error: createError.message });
        continue;
      }

      // Update role (handle_new_user trigger creates the profile, but we need to update the role)
      if (newUser.user) {
        await serviceRole
          .from('profiles')
          .update({ role })
          .eq('id', newUser.user.id);
          
        successful++;
      }
    }

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'admin.user_created',
      resource: 'bulk_import',
      metadata: { successful, failed }
    });

    return NextResponse.json({ successful, failed, errors });

  } catch (error: any) {
    console.error("[CSV Import Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
