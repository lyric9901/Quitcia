// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing your config
firebase.initializeApp({
    apiKey: "AIzaSyASHXyZZs51AKNkZQQbbzIOIHZ1gyZ0Y-4",
    authDomain: "healthygo-cfb50.firebaseapp.com",
    projectId: "healthygo-cfb50",
    storageBucket: "healthygo-cfb50.firebasestorage.app",
    messagingSenderId: "902428193342",
    appId: "1:902428193342:web:1c752bba86bb74cd90d76f",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/icon-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});