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
        <SearchBar />
      </div>
      <div className={styles.actions}>
        <NotificationBell />
      </div>
    </header>
  );
};
