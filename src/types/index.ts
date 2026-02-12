export interface Recipe {
  id: string
  user_id: string
  name: string
  description: string
  prep_time?: string | number
  cook_time?: string | number
  total_time?: string | number
  servings?: number
  ingredients: {
    ingredient: string
    size: string
  }[]
  directions: {
    step_description: string
  }[]
  nutrition_facts: {
    protein: string
    fat: string
    carbs: string
    calories: string
  }
  tags: string[]
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  daily_calorie_goal: number
  meals_per_day: number
  display_days: number
  default_recipes: {
    breakfast?: string
    brunch?: string
    lunch?: string
    dinner?: string
    snack?: string
  }
  meal_times?: {
    breakfast?: string
    brunch?: string
    lunch?: string
    afternoon_snack?: string
    dinner?: string
    snack?: string
  }
  created_at: string
  updated_at: string
}

export interface MealPlan {
  id: string
  user_id: string
  week_start: string
  meals: PlannedMeal[]
  shared_with: string[]
  created_at: string
  updated_at: string
}

export interface PlannedMeal {
  id: string
  recipe_id: string
  day: number // 0-6 (Sunday-Saturday)
  meal_type: 'breakfast' | 'brunch' | 'lunch' | 'afternoon_snack' | 'dinner'
  servings: number
  recipe?: Recipe
}

export interface WeeklyMealPlan {
  [key: string]: { // day-mealType key like "0-breakfast"
    recipe: Recipe
    servings: number
  }
}

export interface ShoppingListItem {
  ingredient: string
  quantity: string
  unit: string
  recipes: string[]
}

export interface CategorizedShoppingList {
  [category: string]: ShoppingListItem[]
}