import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Email = {
  id: string;
  subject: string;
  from_address: string;
  to_addresses: string[];
  body_text: string;
  is_read: boolean;
  is_starred: boolean;
  created_at: string;
  has_attachments?: boolean;
};

export const useEmails = (options: { folder?: string; starred?: boolean }) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    
    const fetchEmails = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('emails')
        .select(`
          id, subject, from_address, to_addresses, body_text, is_read, is_starred, created_at,
          attachments (id)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (options.folder) {
        query = query.eq('folder', options.folder);
      }
      if (options.starred) {
        query = query.eq('is_starred', true);
      }

      const { data } = await query;

      if (isMounted && data) {
        setEmails(data.map(email => ({
          ...email,
          has_attachments: email.attachments && email.attachments.length > 0
        })));
      }
      if (isMounted) setLoading(false);
    };

    fetchEmails();

    const channel = supabase
      .channel(`emails_update`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emails' },
        (payload) => {
          fetchEmails();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [options.folder, options.starred, supabase]);

  const toggleStar = async (id: string, is_starred: boolean) => {
    await supabase.from('emails').update({ is_starred: !is_starred }).eq('id', id);
  };

  return { emails, loading, toggleStar };
};
