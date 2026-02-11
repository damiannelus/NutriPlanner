# Quick Setup Checklist

## ✅ Completed

- [x] PWA icons added (`pwa-192x192.png`, `pwa-512x512.png`)
- [x] Firebase config added to `.env`
- [x] Firebase service worker config updated

## ⚠️ Required Action

### Get VAPID Key (Web Push Certificate)

1. Go to https://console.firebase.google.com
2. Select project: **meal-planner-305e6**
3. Click ⚙️ **Project Settings**
4. Go to **Cloud Messaging** tab
5. Scroll down to "Web Push certificates" section
6. Click **Generate key pair** button
7. Copy the generated key (starts with "B..." and is very long)
8. Open `.env` file
9. Replace `YOUR_VAPID_KEY_HERE` with your actual key:
   ```
   VITE_FIREBASE_VAPID_KEY=BYourActualKeyHere...
   ```
10. Save the file
11. Restart dev server: `npm run dev`

## 🧪 Testing

Once VAPID key is added:

1. **Test Locally**
   ```bash
   npm run dev
   ```
   - Open browser to http://localhost:5173
   - Open DevTools Console
   - You should see: "FCM Token obtained: ..."
   - Grant notification permission when prompted

2. **Check Service Worker**
   - DevTools > Application > Service Workers
   - Should show "firebase-messaging-sw.js" as activated

3. **Test Quick-Vibe Overlay**
   - Manually open: http://localhost:5173/?action=quick-vibe
   - Overlay should appear

## 📦 Deploy Cloud Functions (Next Step)

After testing locally works:

```bash
cd functions
npm install
npm run deploy
```

This will deploy:
- `registerNotificationToken` - Saves FCM tokens
- `checkMealNotifications` - Runs every 30 min to send notifications
- `sendTestNotification` - For testing

## 🚀 Full Production Deploy

```bash
npm run build
firebase deploy
```

## 📊 Monitoring

After deployment, check:
- Firebase Console > Functions > Logs
- Firebase Console > Cloud Messaging > Sends

## Troubleshooting

### "No FCM token available"
- Make sure VAPID key is correct
- Check browser console for errors
- Try in incognito mode

### "Service worker registration failed"
- Must use HTTPS or localhost
- Clear browser cache
- Check service worker code for syntax errors

### Notifications not appearing
- Check notification permission in browser settings
- Look for FCM token in console
- Check Cloud Function logs
