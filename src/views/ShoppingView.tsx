import { useMemo, useState } from 'react'
import { format, addDays, startOfWeek } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { useRecipes } from '../hooks/useRecipes'
import { useMealPlans } from '../hooks/useMealPlans'
import { ShoppingList } from '../components/shopping/ShoppingList'
import { PlannedMeal } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ShoppingCart, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface ShoppingViewProps {
  globalStartDate: Date
  setGlobalStartDate: (date: Date) => void
}

export function ShoppingView({ globalStartDate, setGlobalStartDate }: ShoppingViewProps) {
  const { profile, updateProfile } = useAuth()
  const { recipes } = useRecipes()
  const { getDailyMealPlan } = useMealPlans()
  
  // Use global start date instead of local state
  const startDate = globalStartDate

  const numberOfDays = profile?.display_days || 7

  const handleNumberOfDaysChange = async (newNumberOfDays: number) => {
    if (profile) {
      await updateProfile({ display_days: newNumberOfDays })
    }
  }
  // Generate array of dates for the selected period
  const selectedDates = useMemo(() => {
    return Array.from({ length: numberOfDays }, (_, i) => addDays(startDate, i))
  }, [startDate, numberOfDays])

  // Convert selected dates to PlannedMeal array for ShoppingList component
  const plannedMeals = useMemo((): PlannedMeal[] => {
    const meals: PlannedMeal[] = []
    
    selectedDates.forEach((date, dayIndex) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const dailyPlan = getDailyMealPlan(dateStr)
      
      Object.entries(dailyPlan).forEach(([mealType, meal]) => {
        if (meal) {
          meals.push({
            id: `${dateStr}-${mealType}`,
            recipe_id: meal.recipe.id,
            day: dayIndex,
            meal_type: mealType as any,
            servings: meal.servings,
            recipe: meal.recipe
          })
        }
      })
    })
    
    return meals
  }, [selectedDates, getDailyMealPlan])

  const hasMealPlan = plannedMeals.length > 0

  const navigatePeriod = (direction: 'prev' | 'next') => {
    setGlobalStartDate(prev => addDays(prev, direction === 'next' ? numberOfDays : -numberOfDays))
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Shopping List</h1>
        <p className="text-gray-600">
          {hasMealPlan 
            ? `Generated from your selected meal plan • ${plannedMeals.length} meals planned`
            : 'Select dates to generate a shopping list from your meal plans'
          }
        </p>
      </div>

      {/* Date Selection Controls */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h3 className="text-lg font-medium text-gray-900">Select Period</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Start date:
              </label>
              <input
                type="date"
                value={format(startDate, 'yyyy-MM-dd')}
                onChange={(e) => setGlobalStartDate(new Date(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-w-[140px]"
              />
              </div>
              <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Days:
              </label>
              <select
                value={numberOfDays}
                onChange={(e) => handleNumberOfDaysChange(parseInt(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-w-[80px]"
              >
                {[2, 3, 4, 5, 6, 7].map(days => (
                  <option key={days} value={days}>
                    {days}
                  </option>
                ))}
              </select>
              </div>
            </div>
          </div>

          {/* Period Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigatePeriod('prev')}
              className="w-full sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="text-center flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {numberOfDays === 1 
                  ? format(startDate, 'MMM d, yyyy')
                  : `${format(startDate, 'MMM d')} - ${format(addDays(startDate, numberOfDays - 1), 'MMM d, yyyy')}`
                }
              </h2>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigatePeriod('next')}
              className="w-full sm:w-auto"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Selected Dates Display */}
          <div className="bg-gray-50 rounded-lg p-3 lg:p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2">
              {selectedDates.map((date, index) => (
                <div
                  key={date.toISOString()}
                  className="flex items-center gap-2 bg-white px-2 lg:px-3 py-2 rounded-md border border-gray-200 text-sm"
                >
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-gray-900">
                    {dayNames[(date.getDay() + 6) % 7]} {format(date, 'd')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Shopping List */}
      {hasMealPlan ? (
        <ShoppingList meals={plannedMeals} recipes={recipes} />
      ) : (
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Meal Plans for Selected Period</h3>
          <p className="text-gray-600 mb-4">
            There are no meal plans for the selected dates. Create meal plans to automatically generate your shopping list.
          </p>
          <div className="text-sm text-gray-500">
            Go to <strong>Meal Planning</strong> → <strong>Generate Meal Plan</strong> to get started
          </div>
        </Card>
      )}
    </div>
  )
}