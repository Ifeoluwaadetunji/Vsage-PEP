import React from 'react';
import { CsvImportBanner } from '@/components/admin/CsvImportBanner';
import { CsvImportZone } from '@/components/admin/CsvImportZone';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminUsersPage() {
  // Add server-side protection just in case
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    redirect('/inbox');
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>Admin: Bulk Import Users</h1>
      
      <CsvImportBanner />
      <CsvImportZone />
    </div>
  );
}
