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

// Set up service worker message listener immediately
function setupServiceWorkerMessageListener() {
  console.log('[SW Register] Setting up service worker message listener');
  
  if (!('serviceWorker' in navigator)) {
    return;
  }
  
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('[SW Register] Received message from service worker:', event.data);
    
    if (event.data && event.data.type === 'OPEN_QUICK_VIBE') {
      console.log('[SW Register] OPEN_QUICK_VIBE message received, dispatching custom event');
      // Dispatch custom event to open Quick-Vibe overlay
      window.dispatchEvent(new CustomEvent('open-quick-vibe', {
        detail: event.data.data
      }));
    }
  });
}

// Auto-register when this module is imported
console.log('[SW Register] Module loaded, registering service worker...');
setupServiceWorkerMessageListener();
registerFirebaseMessagingServiceWorker();
