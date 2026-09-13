"use client";
import React from 'react';
import { Star, Paperclip } from 'lucide-react';
import styles from './EmailListItem.module.css';
import { Email } from '@/hooks/useEmails';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Props {
  email: Email;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleStar: (id: string, is_starred: boolean) => void;
}

export const EmailListItem: React.FC<Props> = ({ email, isSelected, onSelect, onToggleStar }) => {
  const router = useRouter();

  const handleRowClick = (e: React.MouseEvent) => {
    // Prevent routing if clicking checkbox or star
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    router.push(`/email/${email.id}`);
  };

  const formattedDate = format(new Date(email.created_at), 'MMM d');

  return (
    <div className={`${styles.item} ${!email.is_read ? styles.unread : ''}`} onClick={handleRowClick}>
      <div className={styles.actions}>
        <input 
          type="checkbox" 
          className={styles.checkbox} 
          checked={isSelected}
          onChange={() => onSelect(email.id)}
        />
        <button 
          className={`${styles.starBtn} ${email.is_starred ? styles.starred : ''}`}
          onClick={() => onToggleStar(email.id, email.is_starred)}
        >
          <Star size={18} fill={email.is_starred ? "currentColor" : "none"} />
        </button>
      </div>

      <div className={styles.sender}>
        {email.from_address.match(/^(.*?)\s*<.*>$/)?.[1]?.replace(/^"|"$/g, '').trim() || email.from_address}
      </div>

      <div className={styles.content}>
        <span className={styles.subject}>{email.subject}</span>
        <span className={styles.preview}>- {email.body_text?.substring(0, 100) || 'No content'}</span>
      </div>

      <div className={styles.meta}>
        {email.has_attachments && <Paperclip size={16} />}
        <span>{formattedDate}</span>
      </div>
    </div>
  );
};
