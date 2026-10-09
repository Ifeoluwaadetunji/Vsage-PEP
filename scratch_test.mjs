import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmails() {
  const { data, error } = await supabase.from('emails').select('id, subject, direction, folder, owner_id');
  if (error) {
    console.error("DB Error:", error);
    return;
  }
  console.log("Emails in DB:");
  console.dir(data, { depth: null });
}

checkEmails();
