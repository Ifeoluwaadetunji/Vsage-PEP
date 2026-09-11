"use client";
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, File } from 'lucide-react';
import styles from './AttachmentDropzone.module.css';

interface Props {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export const AttachmentDropzone: React.FC<Props> = ({ files, onFilesChange }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Prevent adding duplicates
    const newFiles = acceptedFiles.filter(
      newFile => !files.some(f => f.name === newFile.name && f.size === newFile.size)
    );
    onFilesChange([...files, ...newFiles]);
  }, [files, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  return (
    <div>
      <div 
        {...getRootProps()} 
        className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}
      >
        <input {...getInputProps()} />
        <UploadCloud size={24} className={styles.icon} />
        <p>Drag & drop files here, or click to select</p>
      </div>

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((file, idx) => (
            <div key={idx} className={styles.fileItem}>
              <File size={14} className={styles.fileIcon} />
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
              <button 
                type="button" 
                className={styles.removeBtn} 
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
