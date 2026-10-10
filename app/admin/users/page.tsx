import React from 'react';
import { CsvImportBanner } from '@/components/admin/CsvImportBanner';
import { CsvImportZone } from '@/components/admin/CsvImportZone';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDailyAdminCode } from '@/lib/security/adminCode';

export default async function AdminUsersPage() {
  // Add server-side protection just in case
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    redirect('/inbox');
  }

  const dailyCode = getDailyAdminCode();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>Admin: User Management</h1>
      
      <div style={{ background: 'var(--surface-sunken)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--border-subtle)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--accent-primary)' }}>✦</span> Daily Invite Code
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Share this code with new users so they can create an account. This code rotates automatically every 24 hours.
        </p>
        <div style={{ display: 'inline-block', background: 'var(--surface-raised)', padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px', border: '1px solid var(--border-strong)' }}>
          {dailyCode}
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Bulk Import Users</h2>
      <CsvImportBanner />
      <CsvImportZone />
    </div>
  );
}
