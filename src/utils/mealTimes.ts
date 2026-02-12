/**
 * Default meal times by meal type
 */
export const DEFAULT_MEAL_TIMES: Record<string, string> = {
  breakfast: '08:00',
  brunch: '10:30',
  lunch: '12:30',
  afternoon_snack: '15:30',
  dinner: '18:30',
  snack: '15:30',
};

/**
 * Get default scheduled time for a meal type
 * Can optionally check user's custom meal times from profile
 */
export function getDefaultMealTime(mealType: string, userMealTimes?: Record<string, string>): string {
  // First check user's custom times
  if (userMealTimes && userMealTimes[mealType]) {
    return userMealTimes[mealType];
  }
  // Fall back to default times
  return DEFAULT_MEAL_TIMES[mealType] || '12:00';
}

/**
 * Add default scheduled times to a meal plan
 */
export function addScheduledTimesToMealPlan<T extends { scheduledTime?: string }>(
  mealPlan: Record<string, Record<string, T>>
): Record<string, Record<string, T>> {
  const result: Record<string, Record<string, T>> = {};
  
  for (const [dayIndex, dayMeals] of Object.entries(mealPlan)) {
    result[dayIndex] = {};
    
    for (const [mealType, meal] of Object.entries(dayMeals)) {
      result[dayIndex][mealType] = {
        ...meal,
        scheduledTime: meal.scheduledTime || getDefaultMealTime(mealType),
      };
    }
  }
  
  return result;
}
