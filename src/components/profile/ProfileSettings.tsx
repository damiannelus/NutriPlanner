import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { populateRecipes } from '../../scripts/populateRecipes'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface ProfileFormData {
  full_name: string
  daily_calorie_goal: number
  meals_per_day: number
  display_days: number
}

// Meal calorie distribution by meals per day
const MEAL_DISTRIBUTIONS = {
  3: [
    { name: 'Breakfast', percentage: 30 },
    { name: 'Lunch', percentage: 40 },
    { name: 'Dinner', percentage: 30 }
  ],
  4: [
    { name: 'Breakfast', percentage: 20 },
    { name: 'Brunch', percentage: 15 },
    { name: 'Lunch', percentage: 35 },
    { name: 'Dinner', percentage: 30 }
  ],
  5: [
    { name: 'Breakfast', percentage: 20 },
    { name: 'Brunch', percentage: 20 },
    { name: 'Lunch', percentage: 30 },
    { name: 'Afternoon Snack', percentage: 10 },
    { name: 'Dinner', percentage: 20 }
  ]
} as const

export function ProfileSettings() {
  const { profile, updateProfile, user } = useAuth()
  const [isPopulating, setIsPopulating] = useState(false)
  const [populateMessage, setPopulateMessage] = useState('')
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      full_name: profile?.full_name || '',
      daily_calorie_goal: profile?.daily_calorie_goal || 2000,
      meals_per_day: profile?.meals_per_day || 3
      display_days: profile?.display_days || 7
    }
  })

  // Watch the meals_per_day and daily_calorie_goal values for real-time updates
  const watchedMealsPerDay = watch('meals_per_day')
  const watchedCalorieGoal = watch('daily_calorie_goal')

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data)
      // You could add a success toast here
    } catch (error) {
      console.error('Error updating profile:', error)
      // You could add an error toast here
    }
  }

  const handlePopulateRecipes = async () => {
    if (!user) return
    
    setIsPopulating(true)
    setPopulateMessage('Adding sample recipes...')
    
    try {
      const success = await populateRecipes(user.uid)
      if (success) {
        setPopulateMessage('Sample recipes added successfully!')
      } else {
        setPopulateMessage('Failed to add sample recipes.')
      }
    } catch (error) {
      setPopulateMessage('Error adding sample recipes.')
      console.error('Error:', error)
    } finally {
      setIsPopulating(false)
      setTimeout(() => setPopulateMessage(''), 3000)
    }
  }

  if (!profile) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
        <p className="text-gray-600">Manage your account and nutrition preferences</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Full Name"
            {...register('full_name', { required: 'Name is required' })}
            error={errors.full_name?.message}
          />

          <Input
            label="Daily Calorie Goal"
            type="number"
            {...register('daily_calorie_goal', { 
              required: 'Calorie goal is required',
              min: { value: 1000, message: 'Minimum 1000 calories' },
              max: { value: 5000, message: 'Maximum 5000 calories' }
            })}
            error={errors.daily_calorie_goal?.message}
            helperText="Your target daily caloric intake"
          />

          <Input
            label="Meals per Day"
            type="number"
            {...register('meals_per_day', { 
              required: 'Meals per day is required',
              min: { value: 3, message: 'Minimum 3 meals' },
              max: { value: 5, message: 'Maximum 5 meals' }
            })}
            error={errors.meals_per_day?.message}
            helperText="Choose 3-5 meals per day"
          />

          <Input
            label="Display Days"
            type="number"
            {...register('display_days', { 
              required: 'Display days is required',
              min: { value: 2, message: 'Minimum 2 days' },
              max: { value: 7, message: 'Maximum 7 days' }
            })}
            error={errors.display_days?.message}
            helperText="Choose 2-7 days to display in meal planning and shopping list"
          />

          {/* Meal Calorie Distribution Display */}
          {watchedMealsPerDay && MEAL_DISTRIBUTIONS[watchedMealsPerDay as keyof typeof MEAL_DISTRIBUTIONS] && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">Daily Calorie Distribution</h4>
              <div className="space-y-2">
                {MEAL_DISTRIBUTIONS[watchedMealsPerDay as keyof typeof MEAL_DISTRIBUTIONS].map((meal) => {
                  const calories = Math.round((watchedCalorieGoal || 2000) * (meal.percentage / 100))
                  return (
                    <div key={meal.name} className="flex justify-between items-center">
                      <span className="text-blue-800 font-medium">{meal.name}</span>
                      <div className="text-right">
                        <span className="text-blue-900 font-semibold">{meal.percentage}%</span>
                        <span className="text-blue-700 text-sm ml-2">({calories} cal)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-blue-900">Total</span>
                  <span className="text-blue-900">{watchedCalorieGoal || 2000} calories</span>
                </div>
              </div>
            </div>
          )}
          <Button type="submit">
            Save Changes
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Data</h3>
        <p className="text-gray-600 mb-4">
          Get started quickly by adding sample recipes to your collection.
        </p>
        <Button
          onClick={handlePopulateRecipes}
          loading={isPopulating}
          disabled={isPopulating}
          variant="secondary"
        >
          Add Sample Recipes
        </Button>
        {populateMessage && (
          <p className="mt-2 text-sm text-emerald-600">{populateMessage}</p>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{profile.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Member Since</label>
            <p className="text-gray-900">
              {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}