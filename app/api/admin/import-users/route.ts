import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import Papa from 'papaparse';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });
    
    // 1 request per 60 seconds
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1, '60 s'),
    });

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const supabase = await createClient();
    
    // Auth & role check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Rate limit
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(`import_${user.id}_${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many import requests. Please wait 60 seconds.' }, { status: 429 });
    }

    // Parse formData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const text = await file.text();
    
    // Parse CSV
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    
    if (!parsed.meta.fields?.includes('email') || !parsed.meta.fields?.includes('full_name')) {
      return NextResponse.json({ error: 'CSV must contain exactly "email" and "full_name" headers' }, { status: 400 });
    }

    const results = [];

    // Process rows
    for (const row of parsed.data as any[]) {
      if (!row.email || !row.full_name) {
        results.push({ email: row.email || 'Unknown', status: 'error', message: 'Missing fields' });
        continue;
      }

      // Check duplicate
      const { data: existing } = await supabaseAdmin.from('profiles').select('id').eq('email', row.email).single();
      if (existing) {
        results.push({ email: row.email, status: 'skipped', message: 'User already exists' });
        continue;
      }

      // Create user
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: row.email,
        email_confirm: true,
        user_metadata: { full_name: row.full_name }
      });

      if (createErr || !newUser.user) {
        results.push({ email: row.email, status: 'error', message: createErr?.message || 'Creation failed' });
        continue;
      }

      // Welcome email link
      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: row.email
      });

      if (!linkErr && linkData?.properties?.action_link) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'admin@pepmail.com',
            to: row.email,
            subject: 'Welcome to PEP Mail!',
            html: `<p>Hi ${row.full_name},</p><p>You have been invited to PEP Mail. Click <a href="${linkData.properties.action_link}">here</a> to login and set your password.</p>`
          })
        });
      }

      // Audit log
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'admin_import_user',
        details: { target_email: row.email }
      });

      results.push({ email: row.email, status: 'success', message: 'Imported and invited' });
    }

    return NextResponse.json({ results });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Server error during import' }, { status: 500 });
  }
}
