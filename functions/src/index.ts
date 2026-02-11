import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

interface MealPlan {
  userId: string;
  dayIndex: number;
  mealType: string;
  scheduledTime: string; // HH:mm format
  recipeId?: string;
  recipeName?: string;
}

interface NotificationToken {
  userId: string;
  token: string;
  platform: string;
  timestamp: number;
}

/**
 * HTTP endpoint to register FCM tokens
 * Called from the client when user grants notification permission
 */
export const registerNotificationToken = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { token, userId, platform } = req.body;

    if (!token || !userId) {
      res.status(400).json({ error: 'Missing required fields: token, userId' });
      return;
    }

    // Store token in Firestore
    await admin.firestore()
      .collection('notification_tokens')
      .doc(userId)
      .set({
        userId,
        token,
        platform: platform || 'web',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

    console.log(`Registered notification token for user ${userId}`);
    res.status(200).json({ success: true, message: 'Token registered successfully' });
  } catch (error) {
    console.error('Error registering notification token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Scheduled function that runs every 30 minutes to check for meals and send notifications
 * Triggered by Cloud Scheduler
 */
export const checkMealNotifications = functions.pubsub
  .schedule('*/30 * * * *') // Run every 30 minutes
  .timeZone('UTC') // Use UTC as base, convert to user timezones
  .onRun(async (context) => {
    console.log('Running meal notification check...');

    try {
      const nowUTC = new Date();

      // Get all active meal plans
      const mealPlansSnapshot = await admin.firestore()
        .collection('meal_plans')
        .where('weekStart', '<=', nowUTC.toISOString())
        .get();

      const notifications: Array<{userId: string, mealId: string, mealType: string, recipeName?: string}> = [];

      // Check each meal plan for scheduled meals
      for (const doc of mealPlansSnapshot.docs) {
        const mealPlan = doc.data();
        const userId = mealPlan.userId;
        
        // Get user's timezone from their profile (default to UTC if not set)
        let userTimezone = 'UTC';
        try {
          const userDoc = await admin.firestore()
            .collection('profiles')
            .doc(userId)
            .get();
          if (userDoc.exists) {
            userTimezone = userDoc.data()?.timezone || 'UTC';
          }
        } catch (error) {
          console.error(`Error fetching timezone for user ${userId}:`, error);
        }

        // Get current time in user's timezone
        const userTime = new Date(nowUTC.toLocaleString('en-US', { timeZone: userTimezone }));
        const currentHour = userTime.getHours();
        const currentMinute = userTime.getMinutes();
        const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        // Check each day in the meal plan
        Object.entries(mealPlan.days || {}).forEach(([dayIndex, dayMeals]: [string, any]) => {
          Object.entries(dayMeals || {}).forEach(([mealType, meal]: [string, any]) => {
            if (meal && meal.scheduledTime) {
              // Calculate notification time (30-60 minutes after scheduled meal time)
              const notificationTime = calculateNotificationTime(meal.scheduledTime, 45); // 45 min after
              
              // Check if it's time to send notification (within 5-minute window)
              if (isTimeMatch(currentTime, notificationTime, 5)) {
                notifications.push({
                  userId,
                  mealId: `${doc.id}_${dayIndex}_${mealType}`,
                  mealType,
                  recipeName: meal.recipe?.name,
                });
              }
            }
          });
        });
      }

      // Send notifications
      console.log(`Found ${notifications.length} notifications to send`);
      
      for (const notification of notifications) {
        await sendMoodTrackingNotification(
          notification.userId,
          notification.mealId,
          notification.mealType,
          notification.recipeName
        );
      }

      return null;
    } catch (error) {
      console.error('Error checking meal notifications:', error);
      return null;
    }
  });

/**
 * Calculate notification time (minutes after meal time)
 */
function calculateNotificationTime(mealTime: string, minutesAfter: number): string {
  const [hours, minutes] = mealTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + minutesAfter;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

/**
 * Check if current time matches notification time within tolerance
 */
function isTimeMatch(currentTime: string, targetTime: string, toleranceMinutes: number): boolean {
  const [currentH, currentM] = currentTime.split(':').map(Number);
  const [targetH, targetM] = targetTime.split(':').map(Number);
  
  const currentMinutes = currentH * 60 + currentM;
  const targetMinutes = targetH * 60 + targetM;
  
  const diff = Math.abs(currentMinutes - targetMinutes);
  return diff <= toleranceMinutes;
}

/**
 * Send mood tracking notification to user
 */
async function sendMoodTrackingNotification(
  userId: string,
  mealId: string,
  mealType: string,
  recipeName?: string
): Promise<void> {
  try {
    // Get user's FCM token
    const tokenDoc = await admin.firestore()
      .collection('notification_tokens')
      .doc(userId)
      .get();

    if (!tokenDoc.exists) {
      console.log(`No notification token found for user ${userId}`);
      return;
    }

    const tokenData = tokenDoc.data() as NotificationToken;
    const token = tokenData.token;

    // Prepare notification payload
    const mealName = recipeName || mealType;
    const message = {
      notification: {
        title: '🍽️ How are you feeling?',
        body: `Time to track your mood after ${mealName}`,
      },
      data: {
        url: '/?action=quick-vibe',
        mealId,
        mealType,
        timestamp: Date.now().toString(),
      },
      webpush: {
        fcmOptions: {
          link: '/?action=quick-vibe'
        },
        notification: {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'mood-tracking',
          requireInteraction: true,
          actions: [
            { action: 'track', title: 'Track Mood' },
            { action: 'dismiss', title: 'Later' }
          ]
        }
      },
      token,
    };

    // Send the notification
    await admin.messaging().send(message);
    console.log(`Sent mood tracking notification to user ${userId} for meal ${mealId}`);

    // Log notification in Firestore
    await admin.firestore()
      .collection('notification_logs')
      .add({
        userId,
        mealId,
        mealType,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        type: 'mood_tracking',
      });

  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
  }
}

/**
 * Manual trigger for testing - send notification to a specific user
 */
export const sendTestNotification = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    await sendMoodTrackingNotification(
      userId,
      'test_meal_123',
      'Lunch',
      'Test Recipe'
    );

    res.status(200).json({ 
      success: true, 
      message: 'Test notification sent successfully' 
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
