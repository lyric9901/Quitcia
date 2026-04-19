// src/hooks/useFCM.ts
import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import toast from 'react-hot-toast';

export const useFCM = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    const requestPermission = async () => {
      try {
        if (!messaging) return;

        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // 1. Manually register the service worker first
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          
          // 2. Crucial Step: Wait for the service worker to be fully ready and active
          await navigator.serviceWorker.ready;

          // 3. Pass the explicit registration into getToken
          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, 
            serviceWorkerRegistration: registration, // <-- Explicitly bound here
          });
          
          if (token) {
            setFcmToken(token);
            console.log('FCM Token:', token); 
          }
        }
      } catch (error) {
        console.error('An error occurred while retrieving token:', error);
      }
    };

    // Ensure we are in a browser environment that supports Service Workers
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      requestPermission();
    }

    // Handle Foreground Notifications
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        
        // This triggers your react-hot-toast UI
        toast(
          `${payload.notification?.title}: ${payload.notification?.body}`,
          { 
            duration: 4000,
            icon: '🔔',
          }
        );
      });

      return () => {
        unsubscribe(); 
      };
    }
  }, []);

  return { fcmToken };
};