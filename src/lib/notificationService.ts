import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { app } from './firebase'; // Assuming you have Firebase initialized

// VAPID key for web push (get this from Firebase Console > Project Settings > Cloud Messaging)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export interface MoodTrackingData {
  mealId?: string;
  timestamp?: number;
}

export class NotificationService {
  private messaging: ReturnType<typeof getMessaging> | null = null;
  private onMessageCallback: ((payload: MessagePayload) => void) | null = null;

  constructor() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        this.messaging = getMessaging(app);
      } catch (error) {
        console.error('Failed to initialize Firebase Messaging:', error);
      }
    }
  }

  /**
   * Check if notifications are supported in this browser
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported in this browser');
      return false;
    }

    if (this.getPermissionStatus() === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Register service worker for Firebase Messaging
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });
      console.log('Firebase Messaging Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Get FCM token for this device
   */
  async getFCMToken(): Promise<string | null> {
    if (!this.messaging) {
      console.error('Firebase Messaging is not initialized');
      return null;
    }

    try {
      // Request permission first
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('Notification permission denied');
        return null;
      }

      // Register service worker
      const registration = await this.registerServiceWorker();
      if (!registration) {
        console.error('Failed to register service worker');
        return null;
      }

      // Get FCM token
      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        console.log('FCM Token obtained:', token);
        return token;
      } else {
        console.warn('No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Initialize notification service and get token
   * Call this when app starts
   */
  async initialize(): Promise<string | null> {
    if (!this.isSupported()) {
      console.warn('Push notifications are not supported');
      return null;
    }

    try {
      const token = await this.getFCMToken();
      
      if (token) {
        // Setup foreground message handler
        this.setupForegroundMessageHandler();
        // Setup service worker message listener
        this.setupServiceWorkerMessageListener();
      }

      return token;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      return null;
    }
  }

  /**
   * Handle messages when app is in foreground
   */
  private setupForegroundMessageHandler() {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show notification even when app is in foreground
      if (payload.notification) {
        this.showLocalNotification(
          payload.notification.title || 'How are you feeling?',
          payload.notification.body || 'Time to track your mood',
          payload.data
        );
      }

      // Call custom callback if set
      if (this.onMessageCallback) {
        this.onMessageCallback(payload);
      }
    });
  }

  /**
   * Listen for messages from service worker
   */
  private setupServiceWorkerMessageListener() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'OPEN_QUICK_VIBE') {
        // Dispatch custom event to open Quick-Vibe overlay
        window.dispatchEvent(new CustomEvent('open-quick-vibe', {
          detail: event.data.data
        }));
      }
    });
  }

  /**
   * Show a local notification (for foreground messages)
   */
  private showLocalNotification(title: string, body: string, data?: any) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'mood-tracking',
        requireInteraction: true,
        data: {
          url: '/?action=quick-vibe',
          ...data
        },
        actions: [
          { action: 'track', title: 'Track Mood' },
          { action: 'dismiss', title: 'Later' }
        ]
      });
    });
  }

  /**
   * Set callback for foreground messages
   */
  setOnMessageCallback(callback: (payload: MessagePayload) => void) {
    this.onMessageCallback = callback;
  }

  /**
   * Send token to your backend
   * Call this after getting the token to store it for sending notifications
   */
  async sendTokenToServer(token: string, userId: string): Promise<boolean> {
    try {
      // TODO: Replace with your actual API endpoint
      const response = await fetch('/api/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          userId,
          platform: 'web',
          timestamp: Date.now()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send token to server');
      }

      console.log('FCM token registered with server');
      return true;
    } catch (error) {
      console.error('Error sending token to server:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
