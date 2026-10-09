require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data } = await supabase.from('emails').select('body_html, attachments(id, filename)').not('body_html', 'is', null);
  let found = false;
  data.forEach(d => {
    const m = d.body_html.match(/src=["']?(cid:[^"'>\s]+)["']?/i);
    if (m) {
      console.log('Found:', m[1], 'Attachments:', d.attachments);
      found = true;
    } else {
      const extMatch = d.body_html.match(/<img[^>]+src=["']?(http[^"'>\s]+)["']?[^>]*>/i);
      if (extMatch) {
        console.log('Found external image:', extMatch[1]);
        found = true;
      }
    }
  });
  if (!found) console.log('No CIDs or external images found in entire DB.');
}
run();
