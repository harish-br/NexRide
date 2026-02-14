importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAc_V5V4VGQS5mn7qMb3uKMAnSr8FVy2d4",
    authDomain: "nexridein.firebaseapp.com",
    projectId: "nexridein",
    storageBucket: "nexridein.firebasestorage.app",
    messagingSenderId: "320418103794",
    appId: "1:320418103794:web:3e6330fe8b6c23549f2b6b",
    measurementId: "G-0B5HVDEYR0"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png', // Fallback icon
        badge: '/favicon-32x32.png',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
