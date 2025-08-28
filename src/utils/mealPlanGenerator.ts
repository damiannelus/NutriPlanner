import { Recipe, Profile } from '../types'

// Meal calorie distribution by meals per day
const MEAL_DISTRIBUTIONS = {
  3: {
    breakfast: 30,
    lunch: 40,
    dinner: 30
  },
  4: {
    breakfast: 20,
    brunch: 15,
    lunch: 35,
    dinner: 30
  },
  5: {
    breakfast: 20,
    brunch: 20,
    lunch: 30,
    afternoon_snack: 10,
    dinner: 20
  }
} as const

export interface GeneratedMeal {
  recipe: Recipe
  servings: number
}

export interface DailyMealPlan {
  breakfast?: GeneratedMeal
  brunch?: GeneratedMeal
  lunch?: GeneratedMeal
  afternoon_snack?: GeneratedMeal
  dinner?: GeneratedMeal
}

export interface WeeklyMealPlan {
  [dayIndex: string]: DailyMealPlan
}

export function generateWeeklyMealPlan(
  recipes: Recipe[],
  profile: Profile
): WeeklyMealPlan {
  if (recipes.length === 0) {
    throw new Error('No recipes available for meal planning')
  }

  const { daily_calorie_goal, meals_per_day } = profile
  
  const mealTypes = getMealTypesForCount(meals_per_day)
  const mealDistribution = MEAL_DISTRIBUTIONS[meals_per_day as keyof typeof MEAL_DISTRIBUTIONS] || MEAL_DISTRIBUTIONS[3]
  const weeklyPlan: WeeklyMealPlan = {}
  const usedRecipesToday = new Set<string>()

  // Generate plan for 7 days
  for (let day = 0; day < 7; day++) {
    usedRecipesToday.clear()
    weeklyPlan[day.toString()] = generateDailyMealPlan(
      recipes, 
      daily_calorie_goal, 
      mealDistribution,
      mealTypes, 
      usedRecipesToday,
      profile
    )
  }

  return weeklyPlan
}

export function generateMealForSlot(
  recipes: Recipe[],
  targetCalories: number, 
  mealType: string,
  usedRecipes?: Set<string>,
  profile?: Profile
): GeneratedMeal | null {
  return generateMealForSlotInternal(recipes, targetCalories, mealType, usedRecipes, profile)
}

function generateDailyMealPlan(
  recipes: Recipe[],
  targetCalories: number,
  mealDistribution: Record<string, number>,
  mealTypes: string[],
  usedRecipesToday: Set<string>,
  profile: Profile
): DailyMealPlan {
  const maxAttempts = 50
  const targetMin = targetCalories * 0.9
  const targetMax = targetCalories * 1.05
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const dailyPlan: DailyMealPlan = {}
    const attemptUsedRecipes = new Set<string>()
    let totalCalories = 0
    
    // Generate meals for each meal type
    for (const mealType of mealTypes) {
      // Calculate target calories for this specific meal type
      const mealPercentage = mealDistribution[mealType] || (100 / mealTypes.length)
      const targetMealCalories = Math.round((targetCalories * mealPercentage) / 100)
      
      const meal = generateMealForSlot(
        recipes, 
        targetMealCalories, 
        mealType, 
        attemptUsedRecipes,
        profile
      )
      
      if (meal) {
        dailyPlan[mealType as keyof DailyMealPlan] = meal
        attemptUsedRecipes.add(meal.recipe.id)
        
        const mealCalories = parseInt(meal.recipe.nutrition_facts.calories) || 0
        totalCalories += mealCalories * meal.servings
      }
    }
    
    // Check if total calories are within target range
    if (totalCalories >= targetMin && totalCalories <= targetMax) {
      // Success! Update the used recipes for the day
      attemptUsedRecipes.forEach(id => usedRecipesToday.add(id))
      return dailyPlan
    }
  }
  
  // If we couldn't hit the target after max attempts, return the last attempt
  // This ensures we always return something even if it's not perfect
  const fallbackPlan: DailyMealPlan = {}
  
  for (const mealType of mealTypes) {
    const mealPercentage = mealDistribution[mealType] || (100 / mealTypes.length)
    const caloriesPerMeal = Math.round((targetCalories * mealPercentage) / 100)
    const meal = generateMealForSlotInternal(recipes, caloriesPerMeal, mealType, usedRecipesToday, profile)
    if (meal) {
      fallbackPlan[mealType as keyof DailyMealPlan] = meal
      usedRecipesToday.add(meal.recipe.id)
    }
  }
  
  return fallbackPlan
}
function getMealTypesForCount(mealsPerDay: number): string[] {
  const mealConfigs = {
    3: ['breakfast', 'lunch', 'dinner'],
    4: ['breakfast', 'brunch', 'lunch', 'dinner'],
    5: ['breakfast', 'brunch', 'lunch', 'afternoon_snack', 'dinner']
  } as const

  return mealConfigs[mealsPerDay as keyof typeof mealConfigs] || mealConfigs[3]
}

function generateMealForSlotInternal(
  recipes: Recipe[],
  targetCalories: number, 
  mealType: string,
  usedRecipes?: Set<string>,
  profile?: Profile
): GeneratedMeal | null {
  // Map meal types to profile default recipe keys
  const mealTypeMapping: Record<string, string> = {
    'breakfast': 'breakfast',
    'brunch': 'brunch', 
    'lunch': 'lunch',
    'afternoon_snack': 'snack', // Map afternoon_snack to snack in profile
    'dinner': 'dinner',
    'snack': 'snack'
  }
  
  const profileMealType = mealTypeMapping[mealType] || mealType
  
  // Check if there's a default recipe for this meal type
  if (profile?.default_recipes?.[profileMealType as keyof typeof profile.default_recipes]) {
    const defaultRecipeId = profile.default_recipes[profileMealType as keyof typeof profile.default_recipes]
    const defaultRecipe = recipes.find(recipe => recipe.id === defaultRecipeId)
    
    if (defaultRecipe) {
      // Use the default recipe and calculate appropriate servings
      return calculateServings(defaultRecipe, targetCalories)
    }
  }

  // Filter recipes suitable for this meal type
  let suitableRecipes = filterRecipesByMealType(recipes, mealType)
  
  // Exclude already used recipes if provided
  if (usedRecipes && usedRecipes.size > 0) {
    const availableRecipes = suitableRecipes.filter(recipe => !usedRecipes.has(recipe.id))
    // Only use filtered recipes if we have options, otherwise use all suitable recipes
    if (availableRecipes.length > 0) {
      suitableRecipes = availableRecipes
    }
  }
  
  if (suitableRecipes.length === 0) {
    // Fallback to any unused recipe if no suitable ones found
    let fallbackRecipes = recipes
    if (usedRecipes && usedRecipes.size > 0) {
      const availableRecipes = recipes.filter(recipe => !usedRecipes.has(recipe.id))
      if (availableRecipes.length > 0) {
        fallbackRecipes = availableRecipes
      }
    }
    const randomRecipe = fallbackRecipes[Math.floor(Math.random() * fallbackRecipes.length)]
    return calculateServings(randomRecipe, targetCalories)
  }

  // Pick a random suitable recipe
  const randomRecipe = suitableRecipes[Math.floor(Math.random() * suitableRecipes.length)]
  return calculateServings(randomRecipe, targetCalories)
}

function filterRecipesByMealType(recipes: Recipe[], mealType: string): Recipe[] {
  // Simple filtering based on recipe names and tags
  const breakfastKeywords = ['breakfast', 'morning', 'cereal', 'oatmeal', 'pancake', 'toast']
  const lunchKeywords = ['lunch', 'salad', 'sandwich', 'soup', 'bowl']
  const dinnerKeywords = ['dinner', 'roast', 'baked', 'grilled', 'pasta', 'chicken', 'fish']
  const snackKeywords = ['snack', 'dip', 'hummus', 'nuts', 'fruit']

  let keywords: string[] = []
  
  switch (mealType) {
    case 'breakfast':
    case 'second_breakfast':
      keywords = breakfastKeywords
      break
    case 'lunch':
      keywords = lunchKeywords
      break
    case 'dinner':
      keywords = dinnerKeywords
      break
    case 'snack':
      keywords = snackKeywords
      break
    default:
      return recipes // Return all if no specific type
  }

  const filtered = recipes.filter(recipe => {
    const searchText = `${recipe.name} ${recipe.description} ${recipe.tags.join(' ')}`.toLowerCase()
    return keywords.some(keyword => searchText.includes(keyword))
  })

  // If no recipes match the keywords, return all recipes as fallback
  return filtered.length > 0 ? filtered : recipes
}

function calculateServings(recipe: Recipe, targetCalories: number): GeneratedMeal {
  const recipeCalories = parseInt(recipe.nutrition_facts.calories) || 400
  const idealServings = targetCalories / recipeCalories
  
  // Round to reasonable serving sizes (0.5, 1, 1.5, 2, etc.)
  let servings = Math.round(idealServings * 2) / 2
  
  // Ensure minimum 0.5 serving and maximum 3 servings
  servings = Math.max(0.5, Math.min(3, servings))
  
  return {
    recipe,
    servings
  }
}