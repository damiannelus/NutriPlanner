import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Bell, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

/**
 * Development component for testing notifications
 * Add this to your ProfileSettings or any view during development
 */
export function NotificationTester() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [diagnostics, setDiagnostics] = useState<{
    notificationSupport: boolean;
    permission: NotificationPermission;
    serviceWorkerRegistered: boolean;
    serviceWorkerActive: boolean;
  } | null>(null);

  useEffect(() => {
    checkDiagnostics();
  }, []);

  const checkDiagnostics = async () => {
    const diag = {
      notificationSupport: 'Notification' in window,
      permission: Notification.permission,
      serviceWorkerRegistered: false,
      serviceWorkerActive: false,
    };

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        diag.serviceWorkerRegistered = !!registration;
        diag.serviceWorkerActive = !!registration?.active;
      } catch (error) {
        console.error('Error checking service worker:', error);
      }
    }

    setDiagnostics(diag);
  };

  const testBrowserNotification = async () => {
    try {
      console.log('[NotificationTester] Starting test notification...');
      
      // Check if notifications are supported
      if (!('Notification' in window)) {
        setStatus('error');
        setMessage('Notifications not supported in this browser');
        return;
      }

      console.log('[NotificationTester] Current permission:', Notification.permission);

      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        console.log('[NotificationTester] Requesting permission...');
        const permission = await Notification.requestPermission();
        console.log('[NotificationTester] Permission result:', permission);
        
        if (permission !== 'granted') {
          setStatus('error');
          setMessage('Notification permission denied');
          await checkDiagnostics();
          return;
        }
      }

      // Check service worker
      if (!('serviceWorker' in navigator)) {
        setStatus('error');
        setMessage('Service Worker not supported');
        return;
      }

      console.log('[NotificationTester] Getting service worker registration...');
      const registration = await navigator.serviceWorker.ready;
      console.log('[NotificationTester] Service worker ready:', registration);
      
      // Try to show notification
      console.log('[NotificationTester] Showing notification...');
      await registration.showNotification('🍽️ Test: How are you feeling?', {
        body: 'This is a test mood tracking notification. Click to track your mood!',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'mood-tracking-test',
        requireInteraction: false, // Changed to false for better visibility
        vibrate: [200, 100, 200],
        data: {
          url: '/?action=quick-vibe',
          mealId: 'test_meal_123',
          timestamp: Date.now()
        },
        actions: [
          { action: 'track', title: 'Track Mood' },
          { action: 'dismiss', title: 'Later' }
        ]
      });

      console.log('[NotificationTester] Notification shown successfully!');
      setStatus('success');
      setMessage('✅ Test notification sent! Check your notification tray/system notifications.');
      
      // Refresh diagnostics
      await checkDiagnostics();
      
      // Reset status after 7 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 7000);
      
    } catch (error) {
      console.error('[NotificationTester] Error sending test notification:', error);
      setStatus('error');
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await checkDiagnostics();
    }
  };

  const openQuickVibe = () => {
    window.location.href = '/?action=quick-vibe';
  };

  const testMessagePassing = () => {
    console.log('[NotificationTester] Testing message passing...');
    // Simulate what the service worker does
    window.dispatchEvent(new CustomEvent('open-quick-vibe', {
      detail: {
        mealId: 'test_meal_123',
        timestamp: Date.now()
      }
    }));
    setStatus('success');
    setMessage('Test event dispatched! Check if Quick-Vibe opened.');
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 5000);
  };

  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Notification Testing (Dev Only)
        </h3>
      </div>
      
      <p className="text-sm text-gray-600">
        Test the notification system before deploying Cloud Functions.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={testBrowserNotification}
          variant="secondary"
          size="sm"
        >
          <Bell className="h-4 w-4 mr-2" />
          Send Test Notification
        </Button>

        <Button
          onClick={openQuickVibe}
          variant="outline"
          size="sm"
        >
          Open Quick-Vibe Directly
        </Button>

        <Button
          onClick={checkDiagnostics}
          variant="outline"
          size="sm"
        >
          Refresh Status
        </Button>

        <Button
          onClick={testMessagePassing}
          variant="outline"
          size="sm"
        >
          Test Message Passing
        </Button>
      </div>

      {/* Diagnostics Panel */}
      {diagnostics && (
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            System Status
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Notification Support:</span>
              <span className={diagnostics.notificationSupport ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {diagnostics.notificationSupport ? '✓ Supported' : '✗ Not Supported'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Permission:</span>
              <span className={`font-medium ${
                diagnostics.permission === 'granted' ? 'text-green-600' : 
                diagnostics.permission === 'denied' ? 'text-red-600' : 
                'text-yellow-600'
              }`}>
                {diagnostics.permission === 'granted' ? '✓ Granted' : 
                 diagnostics.permission === 'denied' ? '✗ Denied' : 
                 '⚠️ Not Asked'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Service Worker Registered:</span>
              <span className={diagnostics.serviceWorkerRegistered ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {diagnostics.serviceWorkerRegistered ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Service Worker Active:</span>
              <span className={diagnostics.serviceWorkerActive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {diagnostics.serviceWorkerActive ? '✓ Yes' : '✗ No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div className={`
          flex items-center gap-2 p-3 rounded-md text-sm
          ${status === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : ''}
          ${status === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : ''}
        `}>
          {status === 'success' && <CheckCircle className="h-4 w-4" />}
          {status === 'error' && <XCircle className="h-4 w-4" />}
          <span>{message}</span>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>How to test:</strong>
        </p>
        <ol className="text-xs text-blue-700 mt-2 space-y-1 ml-4 list-decimal">
          <li>Click "Send Test Notification"</li>
          <li>Check your browser's notification tray or system notification center</li>
          <li>Click the notification</li>
          <li>Quick-Vibe overlay should open</li>
        </ol>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
        <p className="text-xs text-yellow-900 font-semibold mb-2">
          ⚠️ Notification Not Showing?
        </p>
        <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
          <li><strong>Windows:</strong> Check Settings → System → Notifications. Ensure "Do Not Disturb" and "Focus Assist" are OFF</li>
          <li><strong>Browser:</strong> Click the lock icon in address bar → Check "Notifications" is set to "Allow"</li>
          <li><strong>Chrome:</strong> Go to <code className="bg-yellow-100 px-1 rounded">chrome://settings/content/notifications</code> and disable "Use quieter messaging"</li>
          <li><strong>Edge:</strong> Go to <code className="bg-yellow-100 px-1 rounded">edge://settings/content/notifications</code> and disable "Use quieter messaging"</li>
          <li>Try opening browser DevTools (F12) and check the Console for errors</li>
        </ul>
        <p className="text-xs text-yellow-800 mt-2">
          See <strong>NOTIFICATION_TROUBLESHOOTING.md</strong> for detailed guide
        </p>
      </div>
    </div>
  );
}
