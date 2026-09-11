import React from 'react';
import { AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const CsvImportBanner = () => {
  return (
    <div style={{
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      border: '1px solid var(--accent-primary)',
      borderRadius: 'var(--radius-md)',
      padding: '1rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem'
    }}>
      <AlertCircle size={20} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          CSV Format Required
        </h4>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Your CSV file must include exactly two headers: <strong>email</strong> and <strong>full_name</strong>.
          Any missing columns will cause the import to fail. Duplicate emails will be skipped.
        </p>
        <a href="/api/admin/download-template" target="_blank" rel="noreferrer">
          <Button variant="secondary" size="sm" leftIcon={<Download size={14} />}>
            Download Template
          </Button>
        </a>
      </div>
    </div>
  );
};
