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

        // Request user permission for notifications
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Get the FCM token for this device
          // You need to generate a VAPID key in the Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, 
          });
          
          if (token) {
            setFcmToken(token);
            console.log('FCM Token:', token); // Save this token to your Firestore database so you can target this user later
          }
        }
      } catch (error) {
        console.error('An error occurred while retrieving token:', error);
      }
    };

    requestPermission();

    // Listen for incoming messages while the app is actively open (foreground)
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        // Trigger your react-hot-toast notification
        toast(
          `${payload.notification?.title}: ${payload.notification?.body}`,
          { duration: 4000 }
        );
      });

      return () => {
        unsubscribe(); // Cleanup listener on unmount
      };
    }
  }, []);

  return { fcmToken };
};