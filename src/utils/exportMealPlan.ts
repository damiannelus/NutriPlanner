import { WeeklyMealPlan, Profile, Recipe } from '../types'
import { format, addDays } from 'date-fns'

interface ExportedMeal {
  name: string
  protein: string
  fat: string
  carbs: string
  recipe: {
    ingredients: { ingredient: string; size: string }[]
    directions: { step_description: string }[]
  }
}

interface ExportedDay {
  date: string
  meals: ExportedMeal[]
}

interface ExportedMealPlan {
  generation_date: string
  user_id: string
  days: ExportedDay[]
}

export function exportMealPlanToJSON(
  mealPlan: WeeklyMealPlan,
  weekStart: Date,
  displayDays: number,
  profile: Profile
): void {
  const exportData: ExportedMealPlan = {
    generation_date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    user_id: profile.id,
    days: []
  }

  // Process each day
  for (let dayIndex = 0; dayIndex < displayDays; dayIndex++) {
    const currentDate = addDays(weekStart, dayIndex)
    const dayKey = dayIndex.toString()
    const dayPlan = mealPlan[dayKey]

    const exportedDay: ExportedDay = {
      date: format(currentDate, 'yyyy-MM-dd'),
      meals: []
    }

    // Process each meal in the day
    if (dayPlan) {
      Object.entries(dayPlan).forEach(([mealType, mealData]) => {
        const recipe = mealData.recipe
        
        exportedDay.meals.push({
          name: recipe.name,
          protein: recipe.nutrition_facts.protein,
          fat: recipe.nutrition_facts.fat,
          carbs: recipe.nutrition_facts.carbs,
          recipe: {
            ingredients: recipe.ingredients,
            directions: recipe.directions
          }
        })
      })
    }

    exportData.days.push(exportedDay)
  }

  // Create JSON blob and trigger download
  const jsonString = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `meal-plan-${format(weekStart, 'yyyy-MM-dd')}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}
