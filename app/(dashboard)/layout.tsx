"use client";
import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { EmailComposer } from '@/components/email/EmailComposer';
import styles from './DashboardLayout.module.css';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single();
        if (profile && !profile.email?.endsWith('@mail.vsage.store')) {
          router.push('/onboarding');
        }
      }
    };
    checkOnboarding();
  }, [router]);

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
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {isSidebarOpen && (
        <div 
          className={styles.overlay} 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      <div className={styles.main}>
        <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
        <div className={styles.content}>
          {children}
        </div>
      </div>
      <EmailComposer />
    </div>
  );
}
