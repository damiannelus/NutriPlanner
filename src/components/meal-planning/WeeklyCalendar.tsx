import { useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { Plus, Clock, Users, RefreshCw, Minus } from 'lucide-react'
import { WeeklyMealPlan } from '../../utils/mealPlanGenerator'
import { Recipe } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface WeeklyCalendarProps {
  weekStart: Date
  displayDays?: number
  mealsPerDay: number
  mealPlan: WeeklyMealPlan
  onMealSlotClick?: (dayIndex: number, mealType: string, recipe?: Recipe) => void
  onServingChange?: (dayIndex: number, mealType: string, newServings: number) => void
  dailyCalorieGoal?: number
}

interface MealType {
  id: string
  label: string
}

export function WeeklyCalendar({ weekStart, displayDays = 7, mealsPerDay, mealPlan, onMealSlotClick, onServingChange, dailyCalorieGoal = 2000 }: WeeklyCalendarProps) {
  const mealTypes = useMemo((): MealType[] => {
    const mealConfigs = {
      3: [
        { id: 'breakfast', label: 'Breakfast' },
        { id: 'lunch', label: 'Lunch' },
        { id: 'dinner', label: 'Dinner' }
      ],
      4: [
        { id: 'breakfast', label: 'Breakfast' },
        { id: 'brunch', label: 'Brunch' },
        { id: 'lunch', label: 'Lunch' },
        { id: 'dinner', label: 'Dinner' }
      ],
      5: [
        { id: 'breakfast', label: 'Breakfast' },
        { id: 'brunch', label: 'Brunch' },
        { id: 'lunch', label: 'Lunch' },
        { id: 'dinner', label: 'Dinner' },
        { id: 'afternoon_snack', label: 'Snack' }
      ]
    } as const

    return mealConfigs[mealsPerDay as keyof typeof mealConfigs] || mealConfigs[3]
  }, [mealsPerDay])

  const days = useMemo(() => {
    return Array.from({ length: displayDays }, (_, i) => addDays(weekStart, i))
  }, [weekStart, displayDays])

  // Calculate daily calories for each day
  const getDailyCalories = (dayIndex: number) => {
    const dayPlan = mealPlan[dayIndex.toString()]
    if (!dayPlan) return 0
    
    return Object.values(dayPlan).reduce((total, meal) => {
      if (meal) {
        const calories = parseInt(meal.recipe.nutrition_facts.calories) || 0
        return total + (calories * meal.servings)
      }
      return total
    }, 0)
  }

  // Calculate daily macros for each day
  const getDailyMacros = (dayIndex: number) => {
    const dayPlan = mealPlan[dayIndex.toString()]
    if (!dayPlan) return { protein: 0, carbs: 0, fat: 0 }
    
    return Object.values(dayPlan).reduce((totals, meal) => {
      if (meal) {
        const protein = parseFloat(String(meal.recipe.nutrition_facts.protein).replace(/[^\d.]/g, '')) || 0
        const carbs = parseFloat(String(meal.recipe.nutrition_facts.carbs).replace(/[^\d.]/g, '')) || 0
        const fat = parseFloat(String(meal.recipe.nutrition_facts.fat).replace(/[^\d.]/g, '')) || 0
        
        return {
          protein: totals.protein + (protein * meal.servings),
          carbs: totals.carbs + (carbs * meal.servings),
          fat: totals.fat + (fat * meal.servings)
        }
      }
      return totals
    }, { protein: 0, carbs: 0, fat: 0 })
  }
  
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const shortDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-6">
      {/* Vertical Day Layout */}
      {days.map((day, dayIndex) => {
        const calories = getDailyCalories(dayIndex)
        const macros = getDailyMacros(dayIndex)
        const dayOfWeek = (day.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
        
        return (
          <Card key={day.toISOString()} className="overflow-hidden">
            {/* Day Header */}
            <div className="bg-gray-50 px-4 lg:px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900">
                    <span className="lg:hidden">{shortDayNames[dayOfWeek]}</span>
                    <span className="hidden lg:inline">{dayNames[dayOfWeek]}</span>
                  </h3>
                  <p className="text-sm text-gray-600">{format(day, 'MMM d, yyyy')}</p>
                </div>
                
                {/* Daily Summary */}
                <div className={`text-right ${
                  calories > 0 
                    ? calories >= dailyCalorieGoal * 0.9 && calories <= dailyCalorieGoal * 1.1
                      ? 'text-green-700'
                      : calories < dailyCalorieGoal * 0.9
                      ? 'text-yellow-700'
                      : 'text-red-700'
                    : 'text-gray-500'
                }`}>
                  <div className="text-lg lg:text-xl font-bold">
                    {calories > 0 ? Math.round(calories) : '0'} kcal
                  </div>
                  {calories > 0 && (
                    <div className="text-xs text-gray-500">
                      {Math.round((calories / dailyCalorieGoal) * 100)}% of goal
                    </div>
                  )}
                </div>
              </div>
              
              {/* Macros Summary - Mobile Compact */}
              {calories > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>P: {Math.round(macros.protein)}g</span>
                    <span>C: {Math.round(macros.carbs)}g</span>
                    <span>F: {Math.round(macros.fat)}g</span>
                  </div>
                </div>
              )}
            </div>

            {/* Meals for this day */}
            <div className="p-4 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {mealTypes.map((mealType) => (
                  <MealSlot
                    key={`${day.toISOString()}-${mealType.id}`}
                    day={day}
                    dayIndex={dayIndex}
                    mealType={mealType}
                    mealPlan={mealPlan}
                    onMealSlotClick={onMealSlotClick}
                    onServingChange={onServingChange}
                  />
                ))}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

interface MealSlotProps {
  day: Date
  dayIndex: number
  mealType: MealType
  mealPlan: WeeklyMealPlan
  onMealSlotClick?: (dayIndex: number, mealType: string, recipe?: Recipe) => void
  onServingChange?: (dayIndex: number, mealType: string, newServings: number) => void
}

function MealSlot({ day, dayIndex, mealType, mealPlan, onMealSlotClick, onServingChange }: MealSlotProps) {
  const dayPlan = mealPlan[dayIndex.toString()]
  const meal = dayPlan?.[mealType.id as keyof typeof dayPlan]

  const handleAddMeal = () => {
    onMealSlotClick?.(dayIndex, mealType.id, undefined)
  }

  const handleSwapRecipe = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMealSlotClick?.(dayIndex, mealType.id, undefined)
  }

  const handleServingChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation()
    if (meal && onServingChange) {
      const newServings = Math.max(0.5, Math.min(5, meal.servings + delta))
      if (newServings !== meal.servings) {
        onServingChange(dayIndex, mealType.id, newServings)
      }
    }
  }
  
  if (meal) {
    const totalCalories = Math.round(parseInt(meal.recipe.nutrition_facts.calories) * meal.servings)
    
    return (
      <Card 
        className="p-4 bg-emerald-50 border-emerald-200 hover:shadow-md transition-shadow cursor-pointer group relative"
        onClick={() => onMealSlotClick?.(dayIndex, mealType.id, meal.recipe)}
      >
        {/* Meal Type Label */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-emerald-700">{mealType.label}</span>
          <button
            onClick={handleSwapRecipe}
            className="p-1 rounded-full bg-white shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
            title="Swap recipe"
          >
            <RefreshCw className="h-3 w-3 text-gray-600" />
          </button>
        </div>
        
        {/* Recipe Info */}
        <div className="mb-3">
          <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
            {meal.recipe.name}
          </h4>
          <div className="text-xs text-gray-600">
            {totalCalories} cal
          </div>
        </div>
        
        {/* Serving Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => handleServingChange(e, -0.5)}
              disabled={meal.servings <= 0.5}
              className="w-6 h-6 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Decrease serving"
            >
              <Minus className="h-3 w-3 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-emerald-600 min-w-[3rem] text-center">
              {meal.servings}x
            </span>
            <button
              onClick={(e) => handleServingChange(e, 0.5)}
              disabled={meal.servings >= 5}
              className="w-6 h-6 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Increase serving"
            >
              <Plus className="h-3 w-3 text-gray-600" />
            </button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="text-center">
        <div className="text-sm font-medium text-gray-700 mb-3">{mealType.label}</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddMeal}
          className="w-full border-2 border-dashed border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 py-6"
        >
          <Plus className="h-5 w-5 mb-1" />
          <div className="text-xs">Add meal</div>
        </Button>
      </div>
    </Card>
  )
}