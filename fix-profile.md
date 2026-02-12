# Fix Profile Data

Your profile in Firestore is missing `daily_calorie_goal`. Here's how to fix it:

## Option 1: Use Firebase Console (Easiest)

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: `meal-planner-305e6`
3. Go to Firestore Database
4. Find `profiles` collection
5. Open your profile document (ID: `ZhAN1BU70TUszzr85EdFvOTZ4mn1`)
6. Click "Add field"
7. Add:
   - Field name: `daily_calorie_goal`
   - Type: `number`
   - Value: `2000` (or your desired calorie goal)
8. Click "Update"

## Option 2: Use Browser Console

1. Open your app in the browser
2. Open DevTools (F12) → Console
3. Paste and run this:

```javascript
const { doc, updateDoc } = await import('firebase/firestore');
const { db } = await import('./src/lib/firebase');

await updateDoc(doc(db, 'profiles', 'ZhAN1BU70TUszzr85EdFvOTZ4mn1'), {
  daily_calorie_goal: 2000
});

console.log('✓ Profile fixed!');
location.reload();
```

## What's Wrong

Your current profile data has:
- ✗ Missing: `daily_calorie_goal`
- ✗ `meals_per_day: 3` but 6 meal times are defined
- ✓ Has: `meal_times`, `display_days`, etc.

After fixing `daily_calorie_goal`, the Profile Settings page should display all fields correctly.

## Why This Happened

The profile was created before the `daily_calorie_goal` field was properly initialized, or it was accidentally removed during an update.
