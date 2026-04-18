// worker/index.js
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

// 1. Let Workbox handle the PWA caching (injected by next-pwa)
self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST || []);

// 2. Initialize Firebase in the Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// IMPORTANT: Hardcode your config here. process.env is NOT available in this file.
firebase.initializeApp({
  apiKey: "AIzaSyASHXyZZs51AKNkZQQbbzIOIHZ1gyZ0Y-4",
  authDomain: "healthygo-cfb50.firebaseapp.com",
  projectId: "healthygo-cfb50",
  storageBucket: "healthygo-cfb50.firebasestorage.app",
  messagingSenderId: "902428193342",
  appId: "1:902428193342:web:1c752bba86bb74cd90d76f",
});

const messaging = firebase.messaging();

// 3. Handle Background Notifications
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Received background message: ', payload);
  
  // This is the crucial part that actually triggers the native system UI
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192x192.png', // Ensure this file exists in your public folder
    badge: '/icons/icon-72x72.png',
    data: payload.data, // Pass any custom data along
  };

  // self.registration.showNotification is what makes the banner appear
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 4. Handle Notification Clicks (Optional but recommended)
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received.');
  event.notification.close();

  // If you sent a URL in the payload data, open it
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});