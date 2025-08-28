import { useState } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import { ChevronLeft, ChevronRight, Sparkles, Trash2, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useRecipes } from '../hooks/useRecipes'
import { useMealPlans } from '../hooks/useMealPlans'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { WeeklyCalendar } from '../components/meal-planning/WeeklyCalendar'
import { generateWeeklyMealPlan, generateMealForSlot, type WeeklyMealPlan } from '../utils/mealPlanGenerator'
import { RecipeDetails } from '../components/recipes/RecipeDetails'
import { RecipesView } from './RecipesView'
import { Recipe } from '../types'

interface MealPlanningViewProps {
  mealPlan: WeeklyMealPlan
  setMealPlan: (plan: WeeklyMealPlan | ((prev: WeeklyMealPlan) => WeeklyMealPlan)) => void
  currentWeek: Date
  setCurrentWeek: (week: Date) => void
  globalStartDate: Date
  setGlobalStartDate: (date: Date) => void
  onSelectMealSlot: (slot: { dayIndex: number; mealType: string } | null) => void
  onViewChange: (view: string) => void
}

export function MealPlanningView({ mealPlan, setMealPlan, currentWeek, setCurrentWeek, globalStartDate, setGlobalStartDate, onSelectMealSlot, onViewChange }: MealPlanningViewProps) {
  const { profile, updateProfile } = useAuth()
  const { recipes } = useRecipes()
  const { saveMealPlan, clearWeeklyMealPlan } = useMealPlans()
  const [selectedRecipeForDetails, setSelectedRecipeForDetails] = useState<Recipe | null>(null)
  const [showRecipeSelection, setShowRecipeSelection] = useState(false)
  const [selectedMealSlot, setSelectedMealSlot] = useState<{ dayIndex: number; mealType: string } | null>(null)

  const displayDays = profile?.display_days || 7

  const handleDisplayDaysChange = async (newDisplayDays: number) => {
    if (profile) {
      await updateProfile({ display_days: newDisplayDays })
    }
  }
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? displayDays : -displayDays))
  }

  // Check if all meal slots are filled for the displayed days
  const areAllSlotsFilled = () => {
    const mealTypes = getMealTypesForCount(profile?.meals_per_day || 3)
    
    for (let dayIndex = 0; dayIndex < displayDays; dayIndex++) {
      const dayPlan = mealPlan[dayIndex.toString()]
      for (const mealType of mealTypes) {
        if (!dayPlan?.[mealType]) {
          return false
        }
      }
    }
    return true
  }

  // Get meal types based on meals per day setting
  const getMealTypesForCount = (mealsPerDay: number): string[] => {
    const mealConfigs = {
      3: ['breakfast', 'lunch', 'dinner'],
      4: ['breakfast', 'brunch', 'lunch', 'dinner'],
      5: ['breakfast', 'brunch', 'lunch', 'afternoon_snack', 'dinner']
    } as const

    return mealConfigs[mealsPerDay as keyof typeof mealConfigs] || mealConfigs[3]
  }

  const fillEmptySlots = async () => {
    if (!profile || recipes.length === 0) return
    
    console.log('MealPlanningView: Filling empty slots for', displayDays, 'days')
    
    const mealTypes = getMealTypesForCount(profile.meals_per_day)
    const updatedMealPlan = { ...mealPlan }
    
    // Generate meals only for empty slots
    for (let dayIndex = 0; dayIndex < displayDays; dayIndex++) {
      const dayKey = dayIndex.toString()
      if (!updatedMealPlan[dayKey]) {
        updatedMealPlan[dayKey] = {}
      }
      
      for (const mealType of mealTypes) {
        // Only fill if slot is empty
        if (!updatedMealPlan[dayKey][mealType]) {
          // Use generateMealForSlot to respect default recipes
          const generatedMeal = generateMealForSlot(
            recipes,
            Math.floor(profile.daily_calorie_goal / profile.meals_per_day),
            mealType,
            new Set(), // Don't worry about duplicates for individual slot filling
            profile
          )
          
          if (generatedMeal) {
            updatedMealPlan[dayKey][mealType] = generatedMeal
          }
        }
      }
    }
    
    console.log('MealPlanningView: Filled empty slots, total meals now:', 
      Object.values(updatedMealPlan).reduce((total, day) => total + Object.keys(day).length, 0))
    setMealPlan(updatedMealPlan)
  }

  const generateMealPlan = async () => {
    if (!profile || recipes.length === 0) return
    
    console.log('MealPlanningView: Generating meal plan for', recipes.length, 'recipes')
    
    // Generate meal plan only for the displayed days
    const newMealPlan: WeeklyMealPlan = {}
    for (let dayIndex = 0; dayIndex < displayDays; dayIndex++) {
      const fullWeekPlan = generateWeeklyMealPlan(recipes, profile)
      newMealPlan[dayIndex.toString()] = fullWeekPlan[dayIndex.toString()] || {}
    }
    
    console.log('MealPlanningView: Generated meal plan with', Object.values(newMealPlan).reduce((total, day) => total + Object.keys(day).length, 0), 'total meals')
    setMealPlan(newMealPlan)
  }

  const clearMealPlan = async () => {
    if (!confirm(`Are you sure you want to clear all meals for the displayed ${displayDays} days? This action cannot be undone.`)) {
      return
    }
    
    try {
      const weekStart = format(currentWeek, 'yyyy-MM-dd')
      console.log('MealPlanningView: Clearing meal plan for', displayDays, 'days starting:', weekStart)
      
      // Clear from Firebase for the displayed days only
      await clearDisplayedDays(weekStart, displayDays)
      
      // Clear from local state
      setMealPlan({})
      
      console.log('MealPlanningView: Successfully cleared meal plan')
    } catch (error) {
      console.error('MealPlanningView: Error clearing meal plan:', error)
      // You could add a toast notification here for the error
    }
  }

  const clearDisplayedDays = async (startDate: string, numDays: number) => {
    const startDateObj = new Date(startDate)
    const deletePromises = []
    
    for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
      const dayDate = format(addDays(startDateObj, dayIndex), 'yyyy-MM-dd')
      deletePromises.push(clearWeeklyMealPlan(dayDate))
    }
    
    await Promise.all(deletePromises)
  }
  const handleMealSlotClick = (dayIndex: number, mealType: string, recipe?: Recipe) => {
    console.log('MealPlanningView: Meal slot clicked - day:', dayIndex, 'meal:', mealType, 'hasRecipe:', !!recipe)
    
    if (recipe) {
      // Existing meal clicked - show recipe details
      setSelectedRecipeForDetails(recipe)
      setSelectedMealSlot({ dayIndex, mealType })
    } else {
      // Empty slot clicked - set selected slot and go to recipes
      setSelectedMealSlot({ dayIndex, mealType })
      setShowRecipeSelection(true)
    }
  }

  const handleReplaceRecipe = () => {
    setSelectedRecipeForDetails(null)
    setShowRecipeSelection(true)
  }

  const handleRecipeSelected = (recipe: Recipe) => {
    if (!selectedMealSlot) return
    
    console.log('MealPlanningView: Recipe selected:', recipe.name, 'for slot:', selectedMealSlot)
    
    const { dayIndex, mealType } = selectedMealSlot
    const targetCalories = Math.floor(profile!.daily_calorie_goal) / profile!.meals_per_day
    const recipeCalories = parseInt(recipe.nutrition_facts.calories) || 400
    let servings = targetCalories / recipeCalories
    servings = Math.max(0.5, Math.min(3, Math.round(servings * 2) / 2))
    
    setMealPlan((prev: WeeklyMealPlan) => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [mealType]: {
          recipe,
          servings
        }
      }
    }))
    
    setSelectedMealSlot(null)
    setShowRecipeSelection(false)
  }

  const handleServingChange = (dayIndex: number, mealType: string, newServings: number) => {
    console.log('MealPlanningView: Serving change - day:', dayIndex, 'meal:', mealType, 'servings:', newServings)
    
    setMealPlan((prev: WeeklyMealPlan) => {
      const dayPlan = prev[dayIndex.toString()]
      const meal = dayPlan?.[mealType]
      
      if (meal) {
        return {
          ...prev,
          [dayIndex]: {
            ...dayPlan,
            [mealType]: {
              ...meal,
              servings: newServings
            }
          }
        }
      }
      
      return prev
    })
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  // Show recipe selection view
  if (showRecipeSelection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowRecipeSelection(false)}
          >
            ← Back to Meal Planning
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Select Recipe</h1>
            <p className="text-emerald-600 font-medium">
              Choose a recipe to {selectedMealSlot ? 'replace the selected meal' : 'add to your meal plan'}
            </p>
          </div>
        </div>
        
        <RecipesView
          selectedMealSlot={selectedMealSlot}
          onReplaceMeal={handleRecipeSelected}
          onViewChange={() => {}}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meal Planning</h1>
          <p className="text-gray-600">
            Plan your weekly meals • {profile.meals_per_day} meals per day • {profile.daily_calorie_goal} cal/day
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={generateMealPlan} disabled={recipes.length === 0}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Meal Plan
          </Button>
          <Button 
            onClick={fillEmptySlots} 
            disabled={recipes.length === 0 || areAllSlotsFilled()}
            variant="secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Fill Empty Slots
          </Button>
          <Button 
            onClick={clearMealPlan} 
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Empty the plan
          </Button>
        </div>
      </div>

      {/* Days Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Start date:
              </label>
              <input
                type="date"
                value={format(globalStartDate, 'yyyy-MM-dd')}
                onChange={(e) => setGlobalStartDate(new Date(e.target.value))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <label className="text-sm font-medium text-gray-700">
              Display days:
            </label>
            <select
              value={displayDays}
              onChange={(e) => handleDisplayDaysChange(parseInt(e.target.value))}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {[2, 3, 4, 5, 6, 7].map(days => (
                <option key={days} value={days}>
                  {days} {days === 1 ? 'day' : 'days'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-500">
            Showing {displayDays} {displayDays === 1 ? 'day' : 'days'} starting {format(currentWeek, 'MMM d, yyyy')}
          </div>
        </div>
      </Card>
      {/* Week Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous {displayDays} {displayDays === 1 ? 'Day' : 'Days'}
          </Button>
          
          <h2 className="text-lg font-semibold text-gray-900">
            {displayDays === 1 
              ? format(currentWeek, 'MMM d, yyyy')
              : `${format(currentWeek, 'MMM d')} - ${format(addDays(currentWeek, displayDays - 1), 'MMM d, yyyy')}`
            }
          </h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
          >
            Next {displayDays} {displayDays === 1 ? 'Day' : 'Days'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </Card>

      {/* Calendar */}
      <WeeklyCalendar
        weekStart={currentWeek}
        displayDays={displayDays}
        mealsPerDay={profile.meals_per_day}
        mealPlan={mealPlan}
        onMealSlotClick={handleMealSlotClick}
        onServingChange={handleServingChange}
        dailyCalorieGoal={profile.daily_calorie_goal}
      />

      {/* Recipe Details Modal */}
      <RecipeDetails
        recipe={selectedRecipeForDetails}
        isOpen={!!selectedRecipeForDetails}
        onClose={() => {
          setSelectedRecipeForDetails(null)
          setSelectedMealSlot(null)
        }}
        onReplaceRecipe={handleReplaceRecipe}
      />
    </div>
  )
}