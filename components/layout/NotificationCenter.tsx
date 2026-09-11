"use client";
import React, { useEffect } from 'react';
import { X, Bell, Check, Mail, Info } from 'lucide-react';
import styles from './NotificationCenter.module.css';
import { AppNotification } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  isOpen, onClose, notifications, markAsRead, markAllAsRead 
}) => {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClick = (notif: AppNotification) => {
    if (!notif.is_read) markAsRead(notif.id);
    if (notif.href) {
      router.push(notif.href);
      onClose();
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('email')) return <Mail size={20} />;
    return <Info size={20} />;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Notifications</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={styles.closeBtn} 
              onClick={markAllAsRead} 
              title="Mark all as read"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <Check size={14} /> Read All
            </button>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>
        <div className={styles.content}>
          {notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <Bell size={48} opacity={0.2} />
              <p>You have no new notifications.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`${styles.notificationItem} ${!notif.is_read ? styles.unread : ''}`}
                onClick={() => handleClick(notif)}
                style={{ cursor: notif.href ? 'pointer' : 'default' }}
              >
                <div className={styles.iconWrapper}>
                  {getIcon(notif.type)}
                </div>
                <div className={styles.notificationContent}>
                  <div className={styles.notificationTitle}>{notif.title}</div>
                  {notif.body && <div className={styles.notificationBody}>{notif.body}</div>}
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {format(new Date(notif.created_at), 'MMM d, h:mm a')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
