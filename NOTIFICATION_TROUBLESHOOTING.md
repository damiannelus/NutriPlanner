# Notification Troubleshooting Guide

## Issue: Notifications Not Showing in Tray

If notifications are not appearing despite being enabled, follow these troubleshooting steps:

### 1. Check Browser Notification Settings

#### Chrome/Edge
1. Click the lock icon (🔒) in the address bar
2. Check that "Notifications" is set to "Allow"
3. Go to `chrome://settings/content/notifications` (or `edge://settings/content/notifications`)
4. Ensure the site (https://meal-planner-305e6.web.app) is in the "Allow" list
5. Check that "Use quieter messaging" is **OFF** (this can hide notifications)

#### Firefox
1. Click the lock icon in the address bar
2. Check "Permissions" → "Receive Notifications" is "Allowed"
3. Go to `about:preferences#privacy`
4. Scroll to "Permissions" → "Notifications" → "Settings"
5. Ensure the site is allowed

### 2. Check System Notification Settings

#### Windows 11
1. Open Settings → System → Notifications
2. Ensure "Notifications" toggle is **ON**
3. Check "Do Not Disturb" is **OFF**
4. Scroll down to find your browser (Chrome/Edge/Firefox)
5. Ensure the browser has notification permission **ON**
6. Check "Focus Assist" settings - it should be **OFF** or set to "Priority only"

#### Windows 10
1. Open Settings → System → Notifications & actions
2. Ensure "Get notifications from apps and other senders" is **ON**
3. Find your browser in the list and ensure it's enabled
4. Check "Focus assist" is turned **OFF**

#### macOS
1. System Preferences → Notifications & Focus
2. Find your browser in the list
3. Ensure notifications are enabled
4. Check that "Do Not Disturb" is **OFF**

### 3. Test in Browser Console

Open browser DevTools (F12) and paste this in the Console:

```javascript
// Check notification permission
console.log('Permission:', Notification.permission);

// Check service worker
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Service Worker:', reg ? 'Registered' : 'Not registered');
  console.log('Service Worker Active:', reg?.active ? 'Yes' : 'No');
});

// Try to show a notification
navigator.serviceWorker.ready.then(registration => {
  registration.showNotification('Test Notification', {
    body: 'If you see this, notifications work!',
    icon: '/pwa-192x192.png',
    tag: 'test',
    requireInteraction: false
  }).then(() => {
    console.log('✓ Notification sent successfully');
  }).catch(err => {
    console.error('✗ Error showing notification:', err);
  });
});
```

### 4. Common Issues and Solutions

#### Issue: Permission is "granted" but no notification appears
**Solution:**
- Check Windows/macOS system notification settings (see step 2)
- Check if "Do Not Disturb" or "Focus Assist" is enabled
- Try restarting your browser
- Clear browser cache and reload the page

#### Issue: Service Worker not registered
**Solution:**
- Check browser console for errors
- Ensure you're accessing via HTTPS (not HTTP)
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Clear site data: DevTools → Application → Clear Storage → "Clear site data"
- Reload the page

#### Issue: Service Worker registered but not active
**Solution:**
- Click "skipWaiting" in DevTools → Application → Service Workers
- Or close all tabs with the site and reopen

#### Issue: Notifications work in one browser but not another
**Solution:**
- Each browser has independent permissions
- Repeat permission granting for each browser
- Check system settings for each browser separately

### 5. Force Re-register Service Worker

If nothing works, try this nuclear option:

```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  console.log('All service workers unregistered');
  location.reload();
});
```

Then:
1. Clear browser cache
2. Close all tabs
3. Reopen the site
4. Allow notifications again

### 6. PWA-Specific Issues

If using as installed PWA:
1. Uninstall the PWA
2. Clear browser data for the site
3. Reinstall the PWA
4. Grant notification permission again

### 7. Check Notification Code

Ensure your notification code uses these settings:

```javascript
registration.showNotification(title, {
  body: message,
  icon: '/pwa-192x192.png',
  badge: '/pwa-192x192.png',
  requireInteraction: false,  // Try false first for testing
  tag: 'unique-tag',
  vibrate: [200, 100, 200],
  // Silent: false is default, ensures sound/vibration
});
```

### 8. Debugging Checklist

- [ ] Notification API supported (`'Notification' in window`)
- [ ] Permission is "granted" (`Notification.permission === 'granted'`)
- [ ] Service Worker registered
- [ ] Service Worker active
- [ ] Browser allows notifications (site settings)
- [ ] System allows notifications (OS settings)
- [ ] Do Not Disturb / Focus Assist is OFF
- [ ] No browser extensions blocking notifications
- [ ] Using HTTPS (not HTTP)
- [ ] Icons exist at /pwa-192x192.png and /pwa-512x512.png

### 9. Test with Simple Notification

Try the absolute simplest notification:

```javascript
new Notification('Simple Test', {
  body: 'This is the simplest possible notification'
});
```

If this doesn't work, the issue is at the browser/system level, not your code.

### 10. Alternative: Use Native Notification API

Instead of `registration.showNotification()`, try:

```javascript
if (Notification.permission === 'granted') {
  new Notification('Test', { body: 'Direct notification test' });
}
```

This bypasses the service worker and can help identify if the issue is SW-related.

## Still Not Working?

If after all these steps notifications still don't appear:
1. Check browser version (update if old)
2. Check OS version (some older versions have issues)
3. Try a different browser to isolate the issue
4. Check browser console for any error messages
5. Test on a different device

## Quick Fix for Development

For development/testing, change `requireInteraction: false` in your notification options. This makes notifications appear more prominently and not get hidden by the system.
