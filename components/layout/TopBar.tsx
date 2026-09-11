"use client";
import React from 'react';
import styles from './TopBar.module.css';
import { SearchBar } from './SearchBar';
import { NotificationBell } from './NotificationBell';

export const TopBar = () => {
  return (
    <header className={styles.topbar}>
      <SearchBar />
      <div className={styles.actions}>
        <NotificationBell />
      </div>
    </header>
  );
};
