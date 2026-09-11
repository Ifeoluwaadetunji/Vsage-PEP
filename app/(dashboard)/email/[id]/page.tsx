"use client";
import React, { use } from 'react';
import { useThread } from '@/hooks/useThread';
import { EmailThread } from '@/components/email/EmailThread';
import { Spinner } from '@/components/ui/Spinner';

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { emails, loading, error } = useThread(id);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--danger)' }}>
        <h2>Error loading thread</h2>
        <p>{error}</p>
      </div>
    );
  }

  return <EmailThread emails={emails} />;
}
