import { useState, useEffect } from 'react'
import { useCallback } from 'react'
import { addDays, format } from 'date-fns'
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { WeeklyMealPlan, DailyMealPlan } from '../utils/mealPlanGenerator'
import { useAuth } from '../contexts/AuthContext'

export interface DailyMealPlanDoc {
  id: string
  user_id: string
  date: string // YYYY-MM-DD format
  meals: DailyMealPlan
  created_at: string
  updated_at: string
}

export function useMealPlans() {
  const { user } = useAuth()
  const [dailyMealPlans, setDailyMealPlans] = useState<DailyMealPlanDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !db) {
      setDailyMealPlans([])
      setLoading(false)
      return
    }

    console.log('Setting up Firebase listener for user:', user.uid)

    const q = query(
      collection(db, 'daily_meal_plans'),
      where('user_id', '==', user.uid)
    )

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Firebase snapshot received, docs count:', snapshot.docs.length)
        
        const dailyPlansData = snapshot.docs.map(doc => {
          const data = doc.data()
          console.log('Processing doc:', doc.id, 'date:', data.date, 'meals:', Object.keys(data.meals || {}))
          
          return {
            id: doc.id,
            user_id: data.user_id,
            date: data.date,
            meals: data.meals || {},
            created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString()
          }
        }) as DailyMealPlanDoc[]
        
        console.log('Processed daily meal plans:', dailyPlansData.map(p => ({ date: p.date, mealsCount: Object.keys(p.meals).length })))
        
        setDailyMealPlans(dailyPlansData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Firebase listener error:', err)
        setError(err.message)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user])

  const saveDailyMealPlan = async (date: string, meals: DailyMealPlan) => {
    if (!user || !db) throw new Error('User not authenticated or database not available')

    console.log('Saving daily meal plan for date:', date, 'meals:', meals)

    try {
      // Use date as document ID to ensure uniqueness per user per date
      const docId = `${user.uid}_${date}`
      
      await setDoc(doc(db, 'daily_meal_plans', docId), {
        user_id: user.uid,
        date: date,
        meals,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      }, { merge: true })
      
      console.log('Successfully saved daily meal plan for', date)
    } catch (err) {
      console.error('Error saving daily meal plan:', err)
      throw err instanceof Error ? err : new Error('Failed to save daily meal plan')
    }
  }

  const saveMealPlan = async (weekStart: string, weeklyMealPlan: WeeklyMealPlan) => {
    if (!user || !db) throw new Error('User not authenticated or database not available')

    console.log('Saving weekly meal plan starting:', weekStart, 'plan:', weeklyMealPlan)

    try {
      // Convert weekly meal plan to daily meal plans and save each day separately
      const savePromises = Object.entries(weeklyMealPlan).map(([dayIndex, dailyPlan]) => {
        const weekStartDate = new Date(weekStart)
        const dayDate = format(addDays(weekStartDate, parseInt(dayIndex)), 'yyyy-MM-dd')
        console.log(`Saving day ${dayIndex} (${dayDate}) with meals:`, Object.keys(dailyPlan))
        return saveDailyMealPlan(dayDate, dailyPlan)
      })

      await Promise.all(savePromises)
      console.log('All daily meal plans saved successfully for week:', weekStart)
    } catch (err) {
      console.error('Error saving weekly meal plan:', err)
      throw err instanceof Error ? err : new Error('Failed to save meal plan')
    }
  }

  const deleteDailyMealPlan = async (date: string) => {
    if (!user || !db) throw new Error('User not authenticated or database not available')

    try {
      const docId = `${user.uid}_${date}`
      await deleteDoc(doc(db, 'daily_meal_plans', docId))
      console.log('Deleted daily meal plan for date:', date)
    } catch (err) {
      console.error('Error deleting daily meal plan:', err)
      throw err instanceof Error ? err : new Error('Failed to delete daily meal plan')
    }
  }

  const getMealPlanForWeek = useCallback((weekStart: string): WeeklyMealPlan => {
    console.log('getMealPlanForWeek called with weekStart:', weekStart)
    console.log('Available dailyMealPlans count:', dailyMealPlans.length)
    
    const weeklyPlan: WeeklyMealPlan = {}
    const weekStartDate = new Date(weekStart)
    
    // Generate dates for the week (7 days starting from weekStart)
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayDate = format(addDays(weekStartDate, dayIndex), 'yyyy-MM-dd')
      
      // Find the daily meal plan for this specific date
      const dailyPlan = dailyMealPlans.find(plan => plan.date === dayDate)
      
      console.log(`Day ${dayIndex}: Looking for date ${dayDate}, found:`, dailyPlan ? 'YES' : 'NO')
      if (dailyPlan) {
        console.log(`  - Meals for ${dayDate}:`, Object.keys(dailyPlan.meals))
      }
      
      weeklyPlan[dayIndex.toString()] = dailyPlan?.meals || {}
    }
    
    const totalMealsInWeek = Object.values(weeklyPlan).reduce((total, day) => total + Object.keys(day).length, 0)
    console.log('Final weekly plan for', weekStart, 'contains', totalMealsInWeek, 'total meals')
    
    return weeklyPlan
  }, [dailyMealPlans])

  const getDailyMealPlan = useCallback((date: string): DailyMealPlan => {
    const dailyPlan = dailyMealPlans.find(plan => plan.date === date)
    console.log('getDailyMealPlan for date:', date, 'found:', dailyPlan ? 'YES' : 'NO')
    return dailyPlan?.meals || {}
  }, [dailyMealPlans])

  const generateAndSaveDailyMealPlan = async (date: string, dailyPlan: DailyMealPlan) => {
    console.log('Generating and saving daily meal plan for:', date)
    await saveDailyMealPlan(date, dailyPlan)
  }

  const clearWeeklyMealPlan = async (weekStart: string) => {
    if (!user || !db) throw new Error('User not authenticated or database not available')

    console.log('Clearing daily meal plan for date:', weekStart)

    try {
      const docId = `${user.uid}_${weekStart}`
      console.log(`Deleting daily meal plan for ${weekStart} (docId: ${docId})`)
      await deleteDoc(doc(db, 'daily_meal_plans', docId))
      console.log('Daily meal plan cleared successfully for date:', weekStart)
    } catch (err) {
      console.error('Error clearing daily meal plan:', err)
      throw err instanceof Error ? err : new Error('Failed to clear daily meal plan')
    }
  }

  return {
    dailyMealPlans,
    loading,
    error,
    saveMealPlan,
    saveDailyMealPlan,
    deleteDailyMealPlan,
    getMealPlanForWeek,
    getDailyMealPlan,
    generateAndSaveDailyMealPlan,
    clearWeeklyMealPlan
  }
}