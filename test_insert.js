require('dotenv').config({path:'.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: email, error: emailErr } = await supabase.from('emails').select('id').limit(1).single();
  if (emailErr) return console.error('Failed to get email', emailErr);

  console.log('Got email:', email.id);
  const { data, error } = await supabase.from('attachments').insert({
    email_id: email.id,
    filename: 'test.png',
    mime_type: 'image/png',
    size_bytes: 12345,
    storage_path: 'resend:pending'
  }).select();

  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Inserted:', data);
  }
}

test();
