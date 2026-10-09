import { SupabaseClient } from '@supabase/supabase-js';

export async function getOrCreateThread(
  supabase: SupabaseClient, 
  subject: string, 
  participants: string[]
): Promise<string | null> {
  // Normalize subject by removing common reply/forward prefixes
  const cleanSubject = subject.replace(/^(Re|Fwd|Fw|Aw|Wg):\s*/i, '').trim();

  // Try to find an existing thread with this exact clean subject
  const { data: threads } = await supabase
    .from('email_threads')
    .select('id')
    .ilike('subject', cleanSubject)
    .order('last_message_at', { ascending: false })
    .limit(1);

  if (threads && threads.length > 0) {
    // Update last_message_at to bubble the thread to the top
    await supabase
      .from('email_threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', threads[0].id);
    return threads[0].id;
  }

  // Create new thread if none exists
  const { data: newThread, error } = await supabase
    .from('email_threads')
    .insert({
      subject: cleanSubject,
      participants: participants
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Threading] Failed to create thread:', error);
    return null;
  }

  return newThread?.id;
}
