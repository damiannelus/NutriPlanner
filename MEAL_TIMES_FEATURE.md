# Meal Times Feature

## Overview

Users can now customize their meal times in the Profile Settings. These times are used throughout the app for:
1. Scheduling meals in meal plans
2. Determining when to send mood tracking notifications

## User Interface

### Profile Settings - Meal Times Section

Located in **Profile tab** → **Meal Times** section (green/emerald background)

**Features:**
- Time inputs for all meal types:
  - Breakfast (default: 08:00)
  - Brunch (default: 10:30)
  - Lunch (default: 12:30)
  - Afternoon Snack (default: 15:30)
  - Dinner (default: 18:30)
  - Snack (default: 15:30)

- Grid layout (2 columns on desktop, 1 on mobile)
- Each time input shows as a native time picker
- Tip message: "You'll receive mood tracking notifications 45 minutes after each scheduled meal"

## How It Works

### 1. Default Times

If user hasn't set custom times, the app uses these defaults (from `src/utils/mealTimes.ts`):

```typescript
{
  breakfast: '08:00',
  brunch: '10:30',
  lunch: '12:30',
  afternoon_snack: '15:30',
  dinner: '18:30',
  snack: '15:30'
}
```

### 2. Saving Custom Times

When user updates times in Profile Settings:
1. Times are saved to Firestore in `profiles` collection
2. Stored in `meal_times` field
3. Format: `{ breakfast: "08:00", lunch: "12:30", ... }`

### 3. Using Custom Times

Custom times are used in three places:

**A. Meal Plan Generation**
- When generating weekly meal plans
- `generateWeeklyMealPlan()` uses profile's meal times
- Each meal gets a `scheduledTime` field

**B. Manual Meal Replacement**
- When user manually adds/replaces a meal
- Preserves existing time or uses custom time from profile

**C. Notification Scheduling**
- Cloud Function reads meal times from Firestore
- Calculates notification time = meal time + 45 minutes
- Sends notification at that time in user's timezone

## Data Flow

```
User edits time in Profile
    ↓
Saved to Firestore (profiles.meal_times)
    ↓
Used by meal generator
    ↓
Applied to meals in plan (meal.scheduledTime)
    ↓
Saved to Firestore (meal_plans)
    ↓
Read by Cloud Function
    ↓
Notification sent 45 min after meal time
```

## Code Files Modified

### Frontend
1. `src/types/index.ts` - Added `meal_times` to Profile interface
2. `src/utils/mealTimes.ts` - Added `userMealTimes` parameter to `getDefaultMealTime()`
3. `src/utils/mealPlanGenerator.ts` - Uses profile meal times when generating meals
4. `src/components/profile/ProfileSettings.tsx` - Added Meal Times UI section
5. `src/App.tsx` - Uses profile meal times when replacing meals

### Backend
1. `functions/src/index.ts` - Already reads `scheduledTime` from meal plans

## Database Schema

### Profile Document (Firestore: `profiles` collection)

```typescript
{
  id: string,
  email: string,
  full_name: string,
  daily_calorie_goal: number,
  meals_per_day: number,
  display_days: number,
  default_recipes: {
    breakfast?: string,
    brunch?: string,
    lunch?: string,
    dinner?: string,
    snack?: string
  },
  meal_times: {                    // ← NEW
    breakfast?: string,            // e.g., "08:00"
    brunch?: string,               // e.g., "10:30"
    lunch?: string,                // e.g., "12:30"
    afternoon_snack?: string,      // e.g., "15:30"
    dinner?: string,               // e.g., "18:30"
    snack?: string                 // e.g., "15:30"
  },
  timezone: string,                // e.g., "Europe/Warsaw"
  created_at: string,
  updated_at: string
}
```

### Meal Plan Document (Firestore: `meal_plans` collection)

```typescript
{
  userId: string,
  weekStart: string,
  days: {
    "0": {
      breakfast: {
        recipe: Recipe,
        servings: number,
        scheduledTime: "08:00"     // ← Uses profile times
      },
      lunch: {
        recipe: Recipe,
        servings: number,
        scheduledTime: "12:30"
      },
      // ...
    },
    // ...
  }
}
```

## Testing

### Test Custom Meal Times

1. Go to Profile tab
2. Scroll to "Meal Times" section
3. Change breakfast time to 09:00
4. Click "Save Changes"
5. Go to Meal Planning tab
6. Generate a new meal plan
7. Click on a breakfast meal
8. Should show "⏰ 09:00" next to "Breakfast"

### Test Notifications

1. Set a meal time to current time + 5 minutes
2. Generate meal plan with that meal
3. Wait 45-50 minutes after scheduled time
4. Should receive notification
5. Tap notification → Quick-Vibe overlay opens

## Future Enhancements

- [ ] Per-day meal time customization (e.g., different times on weekends)
- [ ] Customizable notification delay (not just 45 minutes)
- [ ] Multiple notification reminders per meal
- [ ] Smart scheduling based on past meal times
- [ ] Notification time preview in meal calendar view
