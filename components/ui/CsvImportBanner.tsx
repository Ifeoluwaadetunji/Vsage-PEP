import React, { useState } from 'react';
import styles from './CsvImportBanner.module.css';
import { Info, X, Download } from 'lucide-react';
import { Button } from './Button';

export const CsvImportBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,email,full_name,role\nnewuser@domain.com,John Doe,user\nadmin@domain.com,Jane Smith,admin";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.banner}>
      <div className={styles.iconWrapper}>
        <Info size={24} />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>CSV Format Required</h3>
        <p className={styles.description}>
          Your CSV file must include the exact headers: <strong>email</strong>, <strong>full_name</strong>, and optionally <strong>role</strong> (user/admin). 
          Passwords will be auto-generated for new users.
        </p>
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={downloadTemplate} leftIcon={<Download size={16} />}>
            Download Template
          </Button>
        </div>
      </div>
      <button className={styles.closeBtn} onClick={() => setIsVisible(false)} aria-label="Dismiss">
        <X size={20} />
      </button>
    </div>
  );
};
