"use client";
import React, { useState } from 'react';
import { Download, File, Loader2 } from 'lucide-react';
import { Attachment } from '@/hooks/useThread';
import styles from './AttachmentChip.module.css';

export const AttachmentChip = ({ attachment }: { attachment: Attachment }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`/api/email/attachments/download?id=${attachment.id}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className={styles.chip}>
      <File size={16} className={styles.icon} />
      <div className={styles.info}>
        <span className={styles.filename}>{attachment.filename}</span>
        <span className={styles.size}>{formatSize(attachment.size_bytes)}</span>
      </div>
      <button 
        className={styles.downloadBtn} 
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? <Loader2 size={16} className={styles.spin} /> : <Download size={16} />}
      </button>
    </div>
  );
};
