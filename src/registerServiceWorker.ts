// Register service worker immediately when module loads
// This ensures the SW is registered even before user logs in

export async function registerFirebaseMessagingServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW Register] Service workers not supported');
    return null;
  }

  try {
    console.log('[SW Register] Attempting to register firebase-messaging-sw.js...');
    
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    
    console.log('[SW Register] ✓ Service worker registered successfully:', registration);
    console.log('[SW Register] Scope:', registration.scope);
    console.log('[SW Register] Active:', registration.active);
    console.log('[SW Register] Installing:', registration.installing);
    console.log('[SW Register] Waiting:', registration.waiting);
    
    // Wait for SW to become active
    if (registration.installing) {
      console.log('[SW Register] Service worker is installing...');
      registration.installing.addEventListener('statechange', (e) => {
        const sw = e.target as ServiceWorker;
        console.log('[SW Register] State changed to:', sw.state);
      });
    }
    
    return registration;
  } catch (error) {
    console.error('[SW Register] ✗ Failed to register service worker:', error);
    return null;
  }
}

// Auto-register when this module is imported
console.log('[SW Register] Module loaded, registering service worker...');
registerFirebaseMessagingServiceWorker();
