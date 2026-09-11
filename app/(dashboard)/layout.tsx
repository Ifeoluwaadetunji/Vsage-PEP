"use client";
import React, { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { EmailComposer } from '@/components/email/EmailComposer';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-compose'));
      }
      if (e.key === '?') {
        e.preventDefault();
        // window.dispatchEvent(new CustomEvent('open-shortcuts'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <div className={styles.content}>
          {children}
        </div>
      </div>
      <EmailComposer />
    </div>
  );
}
