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
          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, 
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

    requestPermission();

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