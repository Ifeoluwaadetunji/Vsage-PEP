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
            
            // Web Push Subscription
            if ('Notification' in window && Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  const applicationServerKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                  if (applicationServerKey) {
                    registration.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: applicationServerKey
                    }).then(subscription => {
                      console.log('User is subscribed:', subscription);
                      
                      // Save subscription to Supabase
                      const supabase = createClient();
                      supabase.auth.getUser().then(({ data }) => {
                        if (data.user) {
                          supabase.from('push_subscriptions').insert({
                            user_id: data.user.id,
                            subscription: subscription
                          }).then(({ error }) => {
                            if (error && error.code !== '23505') {
                              console.error('Error saving subscription:', error);
                            }
                          });
                        }
                      });
                      
                    }).catch(err => {
                      console.log('Failed to subscribe the user: ', err);
                    });
                  }
                }
              });
            }
          },
          function(err) {
            console.log('Service Worker registration failed: ', err);
          }
        );
      });
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
                      icon: '/logo.png',
                      badge: '/logo.png',
                      data: `/email/${newEmail.id}`
                    });
                  }).catch(() => {
                    // Fallback to basic notification
                    const notification = new Notification(title, {
                      body: subject,
                      icon: '/logo.png'
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
