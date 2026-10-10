"use client";
import React from 'react';
import styles from './TopBar.module.css';
import { SearchBar } from './SearchBar';
import { NotificationBell } from './NotificationBell';
import { Menu } from 'lucide-react';

export const TopBar = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        {/* Mobile Logo display, hides automatically based on layout usually or we can rely on CSS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }} className={styles.mobileLogo}>
          <img src="/logo.png" alt="Logo" style={{ width: 24, height: 24, borderRadius: '6px' }} />
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>Vsage Mail</span>
        </div>
        <SearchBar />
      </div>
      <div className={styles.actions}>
        <NotificationBell />
      </div>
    </header>
  );
};
