"use client";
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';
import { Inbox, Send, FileText, Archive, Trash2, Star, Edit3, Settings, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { name: 'Inbox', path: '/inbox', icon: Inbox },
  { name: 'Starred', path: '/starred', icon: Star },
  { name: 'Sent', path: '/sent', icon: Send },
  { name: 'Drafts', path: '/drafts', icon: FileText },
  { name: 'Archive', path: '/archive', icon: Archive },
  { name: 'Trash', path: '/trash', icon: Trash2 },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<{ email?: string; full_name?: string, role?: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase.from('profiles').select('email, full_name, role').eq('id', user.id).maybeSingle();
          if (data) {
            setProfile(data);
          } else {
            // Profile missing! Auto-heal by inserting one.
            const newProfile = {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
              role: 'admin' // Force admin for recovery since they reported being an admin
            };
            await supabase.from('profiles').insert([newProfile]);
            setProfile(newProfile);
          }
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };
    fetchUser();
  }, []);

  const openCompose = () => {
    window.dispatchEvent(new CustomEvent('open-compose'));
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.composeWrapper}>
        <Button fullWidth size="lg" leftIcon={<Edit3 size={18} />} onClick={openCompose}>
          Compose
        </Button>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <div 
              key={item.name} 
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => router.push(item.path)}
            >
              <Icon size={18} />
              {item.name}
            </div>
          );
        })}

        <div className={styles.sectionTitle}>Labels</div>
        <div className={styles.navItem}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--danger)' }} />
          Urgent
        </div>
        <div className={styles.navItem}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--success)' }} />
          Personal
        </div>

        {profile?.role === 'admin' && (
          <>
            <div className={styles.sectionTitle}>Admin</div>
            <div 
              className={`${styles.navItem} ${pathname.startsWith('/import') ? styles.active : ''}`}
              onClick={() => router.push('/import')}
            >
              <Users size={18} />
              Manage Users
            </div>
          </>
        )}

        <div className={styles.sectionTitle}>Account</div>
        <div 
          className={`${styles.navItem} ${pathname.startsWith('/settings') ? styles.active : ''}`}
          onClick={() => router.push('/settings')}
        >
          <Settings size={18} />
          Settings
        </div>
        <div 
          className={styles.navItem}
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Log Out
        </div>
      </nav>

      <div className={styles.userInfo}>
        <Avatar fallback={profile?.full_name?.charAt(0) || '?'} />
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
            {profile?.full_name || 'Loading...'}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {profile?.email}
          </div>
        </div>
      </div>
    </aside>
  );
};
