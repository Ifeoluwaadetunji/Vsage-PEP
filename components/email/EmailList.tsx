"use client";
import React, { useState } from 'react';
import { useEmails } from '@/hooks/useEmails';
import { EmailListItem } from './EmailListItem';
import { Spinner } from '@/components/ui/Spinner';
import { Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  options: { folder?: string; starred?: boolean };
  title: string;
}

export const EmailList: React.FC<Props> = ({ options, title }) => {
  const { emails, loading, toggleStar } = useEmails(options);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(new Set(emails.map(e => e.id)));
    else setSelectedIds(new Set());
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--bg-secondary)' }}>
        <input 
          type="checkbox" 
          onChange={handleSelectAll} 
          checked={emails.length > 0 && selectedIds.size === emails.length}
        />
        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="secondary" size="sm" leftIcon={<Archive size={16} />}>Archive</Button>
            <Button variant="danger" size="sm" leftIcon={<Trash2 size={16} />}>Delete</Button>
          </div>
        )}
      </div>
      
      {emails.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <p>No emails in {title}</p>
        </div>
      ) : (
        emails.map((email) => (
          <EmailListItem 
            key={email.id} 
            email={email} 
            isSelected={selectedIds.has(email.id)}
            onSelect={handleSelect}
            onToggleStar={toggleStar}
          />
        ))
      )}
    </div>
  );
};
