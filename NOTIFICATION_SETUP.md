# NutriPlanner PWA & Notification Setup Guide

This guide will help you set up push notifications and PWA capabilities for mood tracking after meals.

## Overview

The notification system works as follows:
1. **User grants notification permission** when they first use the app
2. **FCM token is registered** with your backend (Firebase)
3. **Scheduled Cloud Function** runs every 30 minutes to check for meals
4. **Notifications are sent** 30-60 minutes after scheduled meal times
5. **Quick-Vibe overlay** opens when user taps the notification

## Prerequisites

- Firebase project with Firestore and Cloud Functions enabled
- Firebase CLI installed: `npm install -g firebase-tools`
- GCP project (same as Firebase project)

## Step 1: Firebase Configuration

### 1.1 Get Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** > **General**
4. Scroll to "Your apps" and select the web app (or add one)
5. Copy the Firebase configuration object

### 1.2 Update Firebase Service Worker

Edit `public/firebase-messaging-sw.js` and replace the config:

```javascript
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});
```

### 1.3 Get VAPID Key

1. In Firebase Console, go to **Project Settings** > **Cloud Messaging**
2. Scroll to "Web configuration"
3. Under "Web Push certificates", click **Generate key pair**
4. Copy the key

Update `src/lib/notificationService.ts`:
```typescript
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE';
```

### 1.4 Check Firebase Initialization

Make sure `src/lib/firebase.ts` exists and exports `app`. If not, create it:

```typescript
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export const app = initializeApp(firebaseConfig);
```

## Step 2: Generate PWA Icons

You need to create PWA icons. Use a tool like:
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

Place the generated icons in the `public/` folder:
- `pwa-192x192.png`
- `pwa-512x512.png`
- `favicon.ico`
- `apple-touch-icon.png` (optional)

## Step 3: Deploy Cloud Functions

### 3.1 Initialize Firebase Functions (if not already done)

```bash
firebase init functions
```

Choose:
- Use an existing project (select your project)
- Language: TypeScript
- Use ESLint: Yes
- Install dependencies: Yes

### 3.2 Install Dependencies

```bash
cd functions
npm install
```

### 3.3 Update API Endpoint in Client Code

Edit `src/lib/notificationService.ts` and update the API endpoint:

```typescript
async sendTokenToServer(token: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch('https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/registerNotificationToken', {
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
    // ... rest of the code
  }
}
```

Replace:
- `YOUR_REGION` with your GCP region (e.g., `us-central1`)
- `YOUR_PROJECT_ID` with your Firebase project ID

### 3.4 Deploy Cloud Functions

```bash
cd functions
npm run deploy
```

This will deploy:
- `registerNotificationToken` - HTTP endpoint for registering FCM tokens
- `checkMealNotifications` - Scheduled function that runs every 30 minutes
- `sendTestNotification` - HTTP endpoint for testing notifications

## Step 4: Set Up Cloud Scheduler

The `checkMealNotifications` function is automatically scheduled by Firebase, but you need to:

1. Go to [GCP Console](https://console.cloud.google.com)
2. Enable **Cloud Scheduler API** if prompted
3. Verify the scheduled job exists in Cloud Scheduler

## Step 5: Test the Setup

### 5.1 Test Locally

Run the dev server:
```bash
npm run dev
```

1. Open the app in your browser
2. Grant notification permission when prompted
3. Check browser console for FCM token
4. Open browser DevTools > Application > Service Workers - verify worker is registered

### 5.2 Test on Mobile

1. Build and deploy the app:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

2. Open the app on your Android phone (Chrome/Edge)
3. Click "Add to Home Screen" when prompted
4. Grant notification permission
5. Close the app

### 5.3 Send Test Notification

Use the test endpoint to verify notifications work:

```bash
curl -X POST https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/sendTestNotification \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID"}'
```

You should see a notification on your phone!

## Step 6: Add Meal Scheduling Times

For notifications to work, your meal plans need `scheduledTime` fields. Update your meal planning code to include times:

```typescript
{
  [dayIndex]: {
    breakfast: {
      recipe: {...},
      servings: 1,
      scheduledTime: "08:00"  // Add this!
    },
    lunch: {
      recipe: {...},
      servings: 1,
      scheduledTime: "12:30"  // Add this!
    },
    dinner: {
      recipe: {...},
      servings: 1,
      scheduledTime: "18:00"  // Add this!
    }
  }
}
```

## Step 7: Database Setup

Create Firestore indexes if needed:

1. Go to Firebase Console > Firestore
2. Create collections:
   - `notification_tokens` (created automatically by function)
   - `notification_logs` (created automatically by function)
   - `mood_tracking` (you'll need to create this for storing mood data)

### Mood Tracking Schema

```typescript
interface MoodTracking {
  userId: string;
  energy: number;        // 1-10
  mood: string;          // 'satisfied', 'productive', etc.
  context: string;       // 'Post-Lunch Slump', etc.
  notes?: string;
  mealId?: string;
  timestamp: number;
  createdAt: Timestamp;
}
```

## Troubleshooting

### Notifications not appearing

1. **Check permission**: Verify notification permission is granted in browser settings
2. **Check FCM token**: Look for "FCM Token obtained" in console
3. **Check service worker**: DevTools > Application > Service Workers - should show "activated"
4. **Check Cloud Function logs**: 
   ```bash
   firebase functions:log
   ```

### Service worker not registering

1. Must be served over HTTPS (or localhost)
2. Check browser console for errors
3. Clear browser cache and reload

### PWA not installable

1. Verify `manifest.json` is being served
2. Check icons exist and are accessible
3. Must be served over HTTPS
4. Check Chrome DevTools > Application > Manifest for errors

### Notifications work in browser but not as PWA

- PWA notifications use the service worker in `public/firebase-messaging-sw.js`
- Make sure Firebase config is correct in that file
- Check service worker console logs

## Production Checklist

- [ ] Firebase config updated in all files
- [ ] VAPID key added
- [ ] PWA icons generated and added
- [ ] Cloud Functions deployed
- [ ] Cloud Scheduler enabled
- [ ] Test notification received
- [ ] Meal scheduling times added to meal plans
- [ ] Mood tracking database collection created
- [ ] App deployed to Firebase Hosting
- [ ] PWA tested on actual mobile device

## Next Steps

1. **Analytics**: Add tracking for notification opens and mood submissions
2. **Personalization**: Allow users to customize notification timing
3. **Insights**: Build dashboard to show mood trends vs. meals
4. **ML Integration**: Use mood data to recommend optimal meals
5. **Reminders**: Add reminders if user hasn't tracked mood after X hours

## Resources

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [PWA Best Practices](https://web.dev/pwa/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
