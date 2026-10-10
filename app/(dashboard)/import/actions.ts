"use server";

import { createClient } from "@/lib/supabase/server";
import { getDailyAdminCode } from "@/lib/security/adminCode";

export async function getAdminCodeAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  
  return getDailyAdminCode();
}
