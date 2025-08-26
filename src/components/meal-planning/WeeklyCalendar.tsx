import { useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { Plus, Clock, Users, RefreshCw } from 'lucide-react'
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
  dailyCalorieGoal?: number
}

interface MealType {
  id: string
  label: string
}

export function WeeklyCalendar({ weekStart, displayDays = 7, mealsPerDay, mealPlan, onMealSlotClick, dailyCalorieGoal = 2000 }: WeeklyCalendarProps) {
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
  const dailyCalories = useMemo(() => {
    return days.map((_, dayIndex) => {
      const dayPlan = mealPlan[dayIndex.toString()]
      if (!dayPlan) return 0
      
      return Object.values(dayPlan).reduce((total, meal) => {
        if (meal) {
          const calories = parseInt(meal.recipe.nutrition_facts.calories) || 0
          return total + (calories * meal.servings)
        }
        return total
      }, 0)
    })
  }, [mealPlan, days])

  // Calculate daily macros for each day
  const dailyMacros = useMemo(() => {
    return days.map((_, dayIndex) => {
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
    })
  }, [mealPlan, days])
  
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-4">
      {/* Days Header */}
      <div className={`grid gap-4`} style={{ gridTemplateColumns: `auto repeat(${displayDays}, 1fr)` }}>
        <div className="font-medium text-gray-700 text-center py-2">Meals</div>
        {days.map((day, index) => (
          <div key={day.toISOString()} className="text-center">
            <div className="font-medium text-gray-900">{dayNames[(day.getDay() + 6) % 7]}</div>
            <div className="text-sm text-gray-500">{format(day, 'd')}</div>
          </div>
        ))}
      </div>

      {/* Daily Calorie Summary */}
      <div className={`grid gap-4 pt-4 border-t border-gray-200`} style={{ gridTemplateColumns: `auto repeat(${displayDays}, 1fr)` }}>
        <div className="flex items-center justify-center h-16 bg-blue-50 rounded-lg">
          <span className="font-medium text-blue-700 text-sm text-center">
            Daily Total
          </span>
        </div>
        {dailyCalories.map((calories, index) => (
          <div key={index} className="flex items-center justify-center">
            <Card className={`w-full h-full p-2 ${
              calories > 0 
                ? calories >= dailyCalorieGoal * 0.9 && calories <= dailyCalorieGoal * 1.1
                  ? 'bg-green-50 border-green-200'
                  : calories < dailyCalorieGoal * 0.9
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="h-full flex flex-col items-center justify-center space-y-1">
                <div className={`font-bold text-sm ${
                  calories > 0 
                    ? calories >= dailyCalorieGoal * 0.9 && calories <= dailyCalorieGoal * 1.1
                      ? 'text-green-700'
                      : calories < dailyCalorieGoal * 0.9
                      ? 'text-yellow-700'
                      : 'text-red-700'
                    : 'text-gray-500'
                }`}>
                  {calories > 0 ? Math.round(calories) : '0'}
                </div>
                <div className="text-xs text-gray-500">kcal</div>
                {calories > 0 && (
                  <div className="text-xs text-gray-400">
                    {Math.round((calories / dailyCalorieGoal) * 100)}%
                  </div>
                )}
                {calories > 0 && (
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>P: {Math.round(dailyMacros[index].protein)}g</div>
                    <div>C: {Math.round(dailyMacros[index].carbs)}g</div>
                    <div>F: {Math.round(dailyMacros[index].fat)}g</div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>
      {/* Meal Rows */}
      <div className="space-y-3">
        {mealTypes.map((mealType) => (
          <div key={mealType.id} className={`grid gap-4 items-start`} style={{ gridTemplateColumns: `auto repeat(${displayDays}, 1fr)` }}>
            {/* Meal Type Label */}
            <div className="flex items-center justify-center h-20 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700 text-sm text-center">
                {mealType.label}
              </span>
            </div>

            {/* Days */}
            {days.map((day, index) => (
              <MealSlot
                key={`${day.toISOString()}-${mealType.id}`}
                day={day}
                dayIndex={index}
                mealType={mealType}
                mealPlan={mealPlan}
                onMealSlotClick={onMealSlotClick}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface MealSlotProps {
  day: Date
  dayIndex: number
  mealType: MealType
  mealPlan: WeeklyMealPlan
  onMealSlotClick?: (dayIndex: number, mealType: string, recipe?: Recipe) => void
}

function MealSlot({ day, dayIndex, mealType, mealPlan, onMealSlotClick }: MealSlotProps) {
  const dayPlan = mealPlan[dayIndex.toString()]
  const meal = dayPlan?.[mealType.id as keyof typeof dayPlan]

  const handleAddMeal = () => {
    onMealSlotClick?.(dayIndex, mealType.id, undefined)
  }

  const handleSwapRecipe = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMealSlotClick?.(dayIndex, mealType.id, undefined)
  }
  if (meal) {
    const totalCalories = Math.round(parseInt(meal.recipe.nutrition_facts.calories) * meal.servings)
    
    return (
      <Card 
        className="h-20 p-2 bg-emerald-50 border-emerald-200 hover:shadow-md transition-shadow cursor-pointer group relative"
        onClick={() => onMealSlotClick?.(dayIndex, mealType.id, meal.recipe)}
      >
        <button
          onClick={handleSwapRecipe}
          className="absolute top-1 right-1 p-1 rounded-full bg-white shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 z-10"
          title="Swap recipe"
        >
          <RefreshCw className="h-3 w-3 text-gray-600" />
        </button>
        <div className="h-full flex flex-col justify-between">
          <div className="flex-1 min-h-0">
            <h4 className="font-medium text-gray-900 text-xs leading-tight truncate">
              {meal.recipe.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-emerald-600 font-medium">
                {meal.servings}x
              </span>
              <span className="text-xs text-gray-500">
                {totalCalories} cal
              </span>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-20 p-2 hover:shadow-md transition-shadow">
      <div className="h-full flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddMeal}
          className="w-full h-full border-2 border-dashed border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}