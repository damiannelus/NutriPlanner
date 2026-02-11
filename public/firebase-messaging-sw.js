// Firebase Cloud Messaging Service Worker
// This handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCfTjhK9AZ5N_uLl_q7JnONWekzbRfHbvI",
  authDomain: "meal-planner-305e6.firebaseapp.com",
  projectId: "meal-planner-305e6",
  storageBucket: "meal-planner-305e6.firebasestorage.app",
  messagingSenderId: "415053529219",
  appId: "1:415053529219:web:6829c455282c8e25fd9bb6"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'How are you feeling?';
  const notificationOptions = {
    body: payload.notification?.body || 'Time to track your mood after your meal',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'mood-tracking',
    requireInteraction: true, // Keeps notification in tray until user interacts
    data: {
      url: payload.data?.url || '/?action=quick-vibe',
      mealId: payload.data?.mealId,
      timestamp: payload.data?.timestamp || Date.now()
    },
    actions: [
      {
        action: 'track',
        title: 'Track Mood'
      },
      {
        action: 'dismiss',
        title: 'Later'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open the app with quick-vibe overlay
  const urlToOpen = event.notification.data?.url || '/?action=quick-vibe';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            client.postMessage({
              type: 'OPEN_QUICK_VIBE',
              data: event.notification.data
            });
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
