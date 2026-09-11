"use client";
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type ImportResult = {
  email: string;
  status: 'success' | 'error' | 'skipped';
  message?: string;
};

export const CsvImportZone = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResults(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1
  });

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/import-users', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResults(data.results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div 
        {...getRootProps()} 
        style={{
          border: `2px dashed ${isDragActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '2rem',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-secondary)',
          marginBottom: '1rem',
          transition: 'all var(--transition-fast)'
        }}
      >
        <input {...getInputProps()} />
        <UploadCloud size={32} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
        {file ? (
          <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Selected: {file.name}</p>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Drag & drop your .csv file here, or click to browse</p>
        )}
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      {file && !results && (
        <Button onClick={handleImport} isLoading={loading}>
          Start Import
        </Button>
      )}

      {results && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Import Results</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: 'var(--bg-secondary)', maxHeight: '300px', overflowY: 'auto' }}>
            {results.map((row, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
                {row.status === 'success' && <CheckCircle size={16} color="var(--success)" />}
                {row.status === 'error' && <XCircle size={16} color="var(--danger)" />}
                {row.status === 'skipped' && <AlertCircle size={16} color="var(--text-muted)" />}
                <span style={{ width: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.email}</span>
                <span style={{ color: 'var(--text-muted)' }}>{row.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
