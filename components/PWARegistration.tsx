"use client";
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function PWARegistration() {
  useEffect(() => {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(
          function(registration) {
            console.log('Service Worker registration successful with scope: ', registration.scope);
          },
          function(err) {
            console.log('Service Worker registration failed: ', err);
          }
        );
      });
    }

    // 2. Request Notification Permission
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    // 3. Listen to Supabase for incoming emails and trigger notification locally
    const supabase = createClient();
    
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const currentUserId = data.user.id;
        
        const channel = supabase.channel('inbound_email_notifications')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'emails' },
            (payload: any) => {
              const newEmail = payload.new;
              
              // Only notify if it's an inbound email for this user
              if (newEmail.owner_id === currentUserId && newEmail.direction === 'inbound') {
                if (Notification.permission === 'granted') {
                  const subject = newEmail.subject || 'New Email';
                  const from = newEmail.from_address || 'Unknown Sender';
                  const title = `New email from ${from.replace(/<[^>]*>?/gm, '').trim()}`;
                  
                  // Use Service Worker to show notification if available
                  navigator.serviceWorker.ready.then((registration) => {
                    registration.showNotification(title, {
                      body: subject,
                      icon: '/favicon.ico',
                      badge: '/favicon.ico',
                      data: `/email/${newEmail.id}`
                    });
                  }).catch(() => {
                    // Fallback to basic notification
                    const notification = new Notification(title, {
                      body: subject,
                      icon: '/favicon.ico'
                    });
                    notification.onclick = () => {
                      window.location.href = `/email/${newEmail.id}`;
                    };
                  });
                }
              }
            }
          )
          .subscribe();
      }
    });

  }, []);

  return null;
}
