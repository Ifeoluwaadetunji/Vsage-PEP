import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Attachment = {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
};

export type ThreadEmail = {
  id: string;
  subject: string;
  from_address: string;
  to_addresses: string[];
  cc_addresses: string[];
  bcc_addresses: string[];
  body_html: string;
  body_text: string;
  created_at: string;
  is_read: boolean;
  is_starred: boolean;
  attachments: Attachment[];
};

export const useThread = (emailId: string) => {
  const [emails, setEmails] = useState<ThreadEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    let subscription: any = null;

    const fetchThread = async () => {
      setLoading(true);
      setError(null);

      // First get the email to find its thread_id
      const { data: initialEmail, error: err1 } = await supabase
        .from('emails')
        .select('thread_id')
        .eq('id', emailId)
        .single();

      if (err1 || !initialEmail) {
        if (isMounted) setError("Email not found");
        if (isMounted) setLoading(false);
        return;
      }

      // Mark the viewed email as read
      await supabase.from('emails').update({ is_read: true }).eq('id', emailId);

      let query: any;
      const currentThreadId = initialEmail.thread_id;
      if (currentThreadId) {
        // Fetch whole thread
        query = supabase
          .from('emails')
          .select(`
            *,
            attachments (*)
          `)
          .eq('thread_id', currentThreadId)
          .order('created_at', { ascending: true });
          
        // Setup realtime subscription
        subscription = supabase
          .channel(`thread-${currentThreadId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'emails', filter: `thread_id=eq.${currentThreadId}` },
            () => {
              // Re-fetch emails when change happens
              query.then(({ data, error: err }: { data: any, error: any }) => {
                if (!err && isMounted && data) {
                  setEmails(data as ThreadEmail[]);
                }
              });
            }
          )
          .subscribe();
      } else {
        // Just this email
        query = supabase
          .from('emails')
          .select(`
            *,
            attachments (*)
          `)
          .eq('id', emailId);
      }

      const { data, error: err2 } = await query;

      if (err2) {
        if (isMounted) setError(err2.message);
      } else if (isMounted && data) {
        setEmails(data as ThreadEmail[]);
      }

      if (isMounted) setLoading(false);
    };

    fetchThread();

    return () => {
      isMounted = false;
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [emailId, supabase]);

  return { emails, loading, error };
};
