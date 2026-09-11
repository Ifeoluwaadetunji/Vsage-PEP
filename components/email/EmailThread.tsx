"use client";
import React, { useState } from 'react';
import { ThreadEmail } from '@/hooks/useThread';
import { AttachmentChip } from './AttachmentChip';
import { format } from 'date-fns';
import { Avatar } from '../ui/Avatar';
import { ArrowLeft, Reply, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';

export const EmailThread = ({ emails }: { emails: ThreadEmail[] }) => {
  const router = useRouter();
  // Keep all emails except the last one collapsed by default
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    [emails[emails.length - 1]?.id]: true
  });

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReply = () => {
    // Open composer with thread ID
    window.dispatchEvent(new CustomEvent('open-compose', { detail: { replyTo: emails[emails.length - 1] }}));
  };

  if (!emails || emails.length === 0) return null;

  return (
    <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => router.back()} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{emails[0].subject}</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {emails.map((email) => {
          const isExpanded = expanded[email.id];
          return (
            <div 
              key={email.id} 
              style={{ 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-lg)', 
                backgroundColor: 'var(--bg-primary)',
                overflow: 'hidden'
              }}
            >
              <div 
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '1rem', cursor: 'pointer', borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                  backgroundColor: 'var(--bg-secondary)'
                }}
                onClick={() => toggleExpand(email.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Avatar fallback={email.from_address.charAt(0).toUpperCase()} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {email.from_address}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      to {email.to_addresses?.join(', ')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {format(new Date(email.created_at), 'MMM d, h:mm a')}
                  <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><MoreVertical size={16} /></button>
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    {email.body_html ? (
                      <iframe 
                        srcDoc={email.body_html} 
                        sandbox="allow-same-origin allow-popups"
                        style={{ width: '100%', minHeight: '300px', border: 'none', colorScheme: 'dark light' }}
                        title="Email Body"
                      />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                        {email.body_text}
                      </div>
                    )}
                  </div>

                  {email.attachments && email.attachments.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {email.attachments.length} Attachments
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {email.attachments.map(att => <AttachmentChip key={att.id} attachment={att} />)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Button onClick={handleReply} leftIcon={<Reply size={18} />}>
          Reply
        </Button>
      </div>
    </div>
  );
};
