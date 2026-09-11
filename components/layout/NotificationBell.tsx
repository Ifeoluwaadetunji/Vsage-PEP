"use client";
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '@/hooks/useNotifications';

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <>
      <div 
        style={{ position: 'relative', cursor: 'pointer', padding: '0.5rem', color: 'var(--text-secondary)' }}
        onClick={() => setIsOpen(true)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: 'var(--danger)',
            color: 'white',
            borderRadius: '50%',
            width: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.625rem',
            fontWeight: 'bold'
          }}>
            {unreadCount}
          </span>
        )}
      </div>

      <NotificationCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        notifications={notifications}
        markAsRead={markAsRead}
        markAllAsRead={markAllAsRead}
      />
    </>
  );
};
