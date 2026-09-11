import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type ComposeState = {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  html: string;
  text: string;
  attachments: File[];
  draftId?: string;
};

const initialState: ComposeState = {
  to: [], cc: [], bcc: [], subject: '', html: '', text: '', attachments: []
};

export const useCompose = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<ComposeState>(initialState);
  const [isSending, setIsSending] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const openListener = (e: any) => {
      setIsOpen(true);
      if (e.detail?.replyTo) {
        setState({
          ...initialState,
          to: [e.detail.replyTo.from_address],
          subject: `Re: ${e.detail.replyTo.subject}`
        });
      } else {
        setState(initialState);
      }
    };
    window.addEventListener('open-compose', openListener);
    return () => window.removeEventListener('open-compose', openListener);
  }, []);

  const closeCompose = () => setIsOpen(false);

  const updateState = (updates: Partial<ComposeState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Auto-save draft every 30s
  useEffect(() => {
    if (!isOpen || (!state.subject && !state.html)) return;
    
    const saveDraft = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single();
      if (!profile) return;

      const payload = {
        owner_id: user.id,
        from_address: profile.email,
        to_addresses: state.to,
        cc_addresses: state.cc,
        bcc_addresses: state.bcc,
        subject: state.subject || '(No subject)',
        body_html: state.html,
        body_text: state.text,
        direction: 'outbound',
        folder: 'drafts',
        is_draft: true
      };

      if (state.draftId) {
        await supabase.from('emails').update(payload).eq('id', state.draftId);
      } else {
        const { data } = await supabase.from('emails').insert(payload).select('id').single();
        if (data) updateState({ draftId: data.id });
      }
    };

    const interval = setInterval(saveDraft, 30000);
    return () => clearInterval(interval);
  }, [isOpen, state, supabase]);

  const sendEmail = async (overrides?: Partial<ComposeState>) => {
    setIsSending(true);
    const finalState = { ...state, ...overrides };
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: finalState.to,
          cc: finalState.cc,
          bcc: finalState.bcc,
          subject: finalState.subject,
          html: finalState.html,
          text: finalState.text
        })
      });

      if (!res.ok) throw new Error("Failed to send");
      
      const data = await res.json();
      
      // Upload attachments if any
      if (state.attachments.length > 0 && data.db_id) {
        for (const file of state.attachments) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('email_id', data.db_id);
          await fetch('/api/email/attachments/upload', {
            method: 'POST',
            body: formData
          });
        }
      }

      // Delete draft if it existed
      if (state.draftId) {
        await supabase.from('emails').delete().eq('id', state.draftId);
      }

      setIsOpen(false);
      setState(initialState);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return { isOpen, state, isSending, updateState, closeCompose, sendEmail };
};
