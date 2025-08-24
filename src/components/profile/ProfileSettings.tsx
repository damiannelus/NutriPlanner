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
}

export function ProfileSettings() {
  const { profile, updateProfile, user } = useAuth()
  const [isPopulating, setIsPopulating] = useState(false)
  const [populateMessage, setPopulateMessage] = useState('')
  
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      full_name: profile?.full_name || '',
      daily_calorie_goal: profile?.daily_calorie_goal || 2000,
      meals_per_day: profile?.meals_per_day || 3
    }
  })

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
            helperText="Choose 3-5 meals per day (3: B/L/D, 4: B/2nd B/L/D, 5: B/2nd B/L/D/S)"
          />

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