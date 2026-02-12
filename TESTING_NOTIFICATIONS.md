# Testing Notifications Guide

## Quick Test Methods

### ✅ Method 1: Test UI Button (Easiest)

**Added to Profile Settings!**

1. Run dev server: `npm run dev`
2. Go to **Profile** tab
3. Scroll to **"Notification Testing"** section (dashed border)
4. Click **"Send Test Notification"**
5. Check your notification tray
6. Click the notification → Quick-Vibe overlay opens

**What it tests:**
- ✓ Notification permission
- ✓ Service worker registration
- ✓ Notification display
- ✓ Notification click → overlay opening

---

### ✅ Method 2: Direct URL (No notifications)

Just open: http://localhost:5173/?action=quick-vibe

**What it tests:**
- ✓ Quick-Vibe overlay component
- ✓ Mood submission
- ✗ Actual notifications (skipped)

---

### ✅ Method 3: Browser Console

Open DevTools Console and paste:

```javascript
// Request permission
await Notification.requestPermission()

// Get service worker
const registration = await navigator.serviceWorker.ready

// Send test notification
registration.showNotification('🍽️ How are you feeling?', {
  body: 'Time to track your mood after Lunch',
  icon: '/pwa-192x192.png',
  badge: '/pwa-192x192.png',
  tag: 'mood-tracking',
  requireInteraction: true,
  data: {
    url: '/?action=quick-vibe',
    mealId: 'test_123',
    timestamp: Date.now()
  },
  actions: [
    { action: 'track', title: 'Track Mood' },
    { action: 'dismiss', title: 'Later' }
  ]
})
```

---

### ✅ Method 4: Cloud Function Test (After Deploy)

**Prerequisites:**
- Cloud Functions deployed
- FCM token registered
- User logged in

**PowerShell:**
```powershell
.\test-notification.ps1 YOUR_USER_ID
```

**Or manually with curl:**
```bash
curl -X POST https://us-central1-meal-planner-305e6.cloudfunctions.net/sendTestNotification \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID"}'
```

**Get your User ID:**
1. Open DevTools Console
2. Run: `localStorage.getItem('supabase.auth.token')`
3. Find `user.id` in the token

---

## Troubleshooting

### "Notification permission denied"
**Fix:** 
1. Click lock icon in browser address bar
2. Find "Notifications"
3. Set to "Allow"
4. Refresh page

### "Service worker not found"
**Fix:**
1. Make sure VAPID key is added to `.env`
2. Restart dev server
3. Check DevTools > Application > Service Workers
4. Should show `firebase-messaging-sw.js`

### "Notification doesn't appear"
**Possible causes:**
- Browser notification settings disabled
- Do Not Disturb mode enabled (OS)
- Browser in focus (some browsers don't show notifications when focused)
- Try minimizing browser window

### "Clicking notification does nothing"
**Check:**
1. DevTools Console for errors
2. Service worker console (DevTools > Application > Service Workers > Console)
3. Make sure service worker code is correct in `public/firebase-messaging-sw.js`

---

## Testing Checklist

Before deploying to production:

- [ ] Test notification permission request
- [ ] Test notification display
- [ ] Test notification click → opens Quick-Vibe
- [ ] Test "Track Mood" action
- [ ] Test "Later" action  
- [ ] Test notification when app is in foreground
- [ ] Test notification when app is in background
- [ ] Test notification when app is closed
- [ ] Test on mobile device (PWA)
- [ ] Test with actual Cloud Function
- [ ] Test timezone handling
- [ ] Test custom meal times

---

## Expected Behavior

### When App is Open (Foreground)
✓ Notification appears in system tray
✓ Click notification → app focuses + Quick-Vibe opens

### When App is Minimized (Background)
✓ Notification appears in system tray
✓ Click notification → app opens + Quick-Vibe opens

### When App is Closed
✓ Notification appears in system tray
✓ Click notification → app launches + Quick-Vibe opens

### On Mobile (PWA)
✓ Notification appears even when app is not running
✓ Tap notification → PWA opens + Quick-Vibe opens
✓ Notification stays in tray (`requireInteraction: true`)

---

## Test Scenarios

### Scenario 1: Happy Path
1. User sets lunch time to 12:30
2. Generates meal plan
3. At 13:15 (12:30 + 45 min), notification appears
4. User taps notification
5. Quick-Vibe opens
6. User tracks mood (Energy: 7, Mood: Satisfied)
7. Mood saved to database

### Scenario 2: User Ignores Notification
1. Notification appears at 13:15
2. User doesn't interact with it
3. Notification stays in tray (requireInteraction: true)
4. User taps it later (e.g., 14:00)
5. Quick-Vibe still opens correctly

### Scenario 3: Multiple Notifications
1. User has breakfast at 08:00, lunch at 12:30
2. At 08:45 → breakfast notification
3. User tracks mood
4. At 13:15 → lunch notification
5. User tracks mood
6. Each notification tracked separately

---

## Debug Mode

To see detailed logs:

**Browser Console:**
```javascript
// Check notification permission
console.log('Permission:', Notification.permission)

// Check service worker status
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW Registration:', reg)
  console.log('SW Active:', reg?.active?.state)
})

// Check FCM token
// (should see in console when app loads)
// Look for: "FCM Token obtained: ..."
```

**Service Worker Console:**
DevTools > Application > Service Workers > Click "firebase-messaging-sw.js" > Console

---

## Remove Test UI (Before Production)

Once testing is done, remove the test UI:

1. Open `src/components/profile/ProfileSettings.tsx`
2. Remove:
   ```typescript
   import { NotificationTester } from '../dev/NotificationTester'
   ```
3. Remove:
   ```tsx
   <Card className="p-6">
     <NotificationTester />
   </Card>
   ```
4. Optional: Delete `src/components/dev/NotificationTester.tsx`
