"use client";
import React, { useState, useEffect } from 'react';
import { CsvImportBanner } from '@/components/ui/CsvImportBanner';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { UploadCloud, File, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './Import.module.css';
import { getAdminCodeAction } from './actions';

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [dailyCode, setDailyCode] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getAdminCodeAction().then(code => setDailyCode(code));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/users/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setResults(data);
      toast({
        type: 'success',
        title: 'Import Complete',
        message: `Successfully imported ${data.successful} users.`,
      });
      setFile(null);
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Import Error',
        message: err.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className="text-h2">User Management</h1>
        <p className="text-body">Manage invites and import users.</p>
      </div>

      {dailyCode && (
        <div style={{ background: 'var(--surface-sunken)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-primary)' }}>✦</span> Daily Invite Code
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Share this code with new users so they can create an account. This code rotates automatically every 24 hours.
          </p>
          <div style={{ display: 'inline-block', background: 'var(--surface-raised)', padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px', border: '1px solid var(--border-strong)' }}>
            {dailyCode}
          </div>
        </div>
      )}

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Bulk User Import</h2>
      <CsvImportBanner />

      <div className={styles.uploadCard}>
        <div className={styles.uploadArea}>
          <UploadCloud size={48} className={styles.uploadIcon} />
          <h3 className="text-h3">Upload CSV File</h3>
          <p className="text-body">Drag and drop your file here, or click to browse.</p>
          
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            className={styles.fileInput}
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className={styles.browseButton}>
            Browse Files
          </label>
        </div>

        {file && (
          <div className={styles.filePreview}>
            <div className={styles.fileInfo}>
              <File size={24} style={{ color: "var(--accent-primary)" }} />
              <div>
                <p className={styles.fileName}>{file.name}</p>
                <p className={styles.fileSize}>{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <Button 
              onClick={handleUpload} 
              isLoading={isUploading}
            >
              Start Import
            </Button>
          </div>
        )}
      </div>

      {results && (
        <div className={styles.resultsCard}>
          <h3 className="text-h3">Import Summary</h3>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <CheckCircle size={20} style={{ color: "var(--success)" }} />
              <span>{results.successful} Imported Successfully</span>
            </div>
            <div className={styles.statItem}>
              <AlertCircle size={20} style={{ color: "var(--danger)" }} />
              <span>{results.failed} Failed</span>
            </div>
          </div>
          
          {results.errors && results.errors.length > 0 && (
            <div className={styles.errorList}>
              <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Errors:</h4>
              <ul>
                {results.errors.map((err: any, i: number) => (
                  <li key={i} style={{ color: "var(--danger)", fontSize: "0.875rem" }}>
                    Row {err.row} {err.email ? `(${err.email})` : ''}: {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
