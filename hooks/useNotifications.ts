"use client";
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/ToastProvider';

export type NotificationType = 'email.received' | 'email.bounced' | 'email.delivered' | 'admin.invite' | 'system';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  resource_id?: string;
  href?: string;
  is_read: boolean;
  created_at: string;
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data as AppNotification[]);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      await fetchNotifications();
    };
    init();

    const channel = supabase
      .channel('notifications_all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);

          // 1. Toast
          toast({ title: newNotif.title, message: newNotif.body || 'New notification', type: 'info' });

          // 2. Native Browser Notification
          if (Notification.permission === 'granted') {
            const browserNotif = new Notification(newNotif.title, {
              body: newNotif.body,
              icon: '/favicon.ico'
            });
            browserNotif.onclick = () => {
              window.focus();
              if (newNotif.href) {
                window.location.href = newNotif.href;
              }
            };
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload) => {
          fetchNotifications(); // Simple refresh for updates (e.g. marked as read)
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, toast]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('notifications').update({ is_read: true }).eq('owner_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
};
