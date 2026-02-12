import { useState, useEffect, useCallback } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthForm } from './components/auth/AuthForm'
import { Navigation } from './components/layout/Navigation'
import { RecipesView } from './views/RecipesView'
import { MealPlanningView } from './views/MealPlanningView'
import { ShoppingView } from './views/ShoppingView'
import { ProfileSettings } from './components/profile/ProfileSettings'
import { WeeklyMealPlan } from './utils/mealPlanGenerator'
import { useMealPlans } from './hooks/useMealPlans'
import { format, startOfWeek, isSameDay } from 'date-fns'
import QuickVibeOverlay from './components/QuickVibeOverlay'
import { notificationService } from './lib/notificationService'
import { getUserTimezone } from './utils/timezone'
import { getDefaultMealTime } from './utils/mealTimes'
import { doc, setDoc } from 'firebase/firestore'
import { db } from './lib/firebase'

function AppContent() {
  const { user, profile, loading } = useAuth()
  const { saveMealPlan, getMealPlanForWeek, loading: mealPlansLoading } = useMealPlans()
  const [currentView, setCurrentView] = useState('recipes')
  const [selectedMealSlot, setSelectedMealSlot] = useState<{
    dayIndex: number
    mealType: string
  } | null>(null)
  
  const [currentWeek, setCurrentWeek] = useState(() => new Date())
  const [mealPlan, setMealPlan] = useState<WeeklyMealPlan>({})
  const [globalStartDate, setGlobalStartDate] = useState(() => new Date())
  
  // Quick-Vibe overlay state
  const [isQuickVibeOpen, setIsQuickVibeOpen] = useState(false)
  const [quickVibeMealId, setQuickVibeMealId] = useState<string | undefined>()

  // Initialize notifications and save timezone when user logs in
  useEffect(() => {
    if (user && db) {
      const initUserSettings = async () => {
        try {
          // Detect and save user's timezone
          const timezone = getUserTimezone()
          await setDoc(doc(db, 'profiles', user.id), {
            timezone,
            timezoneUpdatedAt: new Date().toISOString()
          }, { merge: true })
          console.log(`Saved user timezone: ${timezone}`)

          // Initialize notifications
          const token = await notificationService.initialize()
          if (token && user.id) {
            await notificationService.sendTokenToServer(token, user.id)
          }
        } catch (error) {
          console.error('Failed to initialize user settings:', error)
        }
      }
      
      initUserSettings()
    }
  }, [user])

  // Listen for service worker messages to open Quick-Vibe overlay
  useEffect(() => {
    const handleOpenQuickVibe = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('Opening Quick-Vibe overlay from notification', customEvent.detail)
      setQuickVibeMealId(customEvent.detail?.mealId)
      setIsQuickVibeOpen(true)
    }

    window.addEventListener('open-quick-vibe', handleOpenQuickVibe)
    return () => window.removeEventListener('open-quick-vibe', handleOpenQuickVibe)
  }, [])

  // Check URL params for quick-vibe action
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('action') === 'quick-vibe') {
      setIsQuickVibeOpen(true)
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only trigger shortcuts if not typing in an input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLSelectElement) {
        return
      }

      // Prevent shortcuts when modals or forms are open
      if (document.querySelector('[role="dialog"]') || 
          document.querySelector('.modal') ||
          selectedMealSlot ||
          isQuickVibeOpen) {
        return
      }

      const key = event.key.toLowerCase()
      
      switch (key) {
        case 'r':
          setCurrentView('recipes')
          event.preventDefault()
          break
        case 'm':
          setCurrentView('meal-planning')
          event.preventDefault()
          break
        case 's':
          setCurrentView('shopping')
          event.preventDefault()
          break
        case 'p':
          setCurrentView('profile')
          event.preventDefault()
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [selectedMealSlot, isQuickVibeOpen])

  // Load meal plan for current week when week changes or data loads
  useEffect(() => {
    if (!mealPlansLoading && user && getMealPlanForWeek) {
      const weekStart = format(currentWeek, 'yyyy-MM-dd')
      console.log('App: Loading meal plan for week starting:', weekStart)
      const loadedPlan = getMealPlanForWeek(weekStart)
      console.log('App: Loaded meal plan with', Object.values(loadedPlan).reduce((total, day) => total + Object.keys(day).length, 0), 'total meals')
      setMealPlan(loadedPlan)
    }
  }, [currentWeek, mealPlansLoading, getMealPlanForWeek, user])

  // Sync currentWeek with globalStartDate
  useEffect(() => {
    if (!isSameDay(currentWeek, globalStartDate)) {
      setCurrentWeek(globalStartDate)
    }
  }, [globalStartDate, currentWeek])

  // Save meal plan to Firebase (called when meal plan is updated)
  const saveMealPlanToFirebase = useCallback(async (newMealPlan: WeeklyMealPlan) => {
    try {
      const weekStart = format(currentWeek, 'yyyy-MM-dd')
      console.log('App: Saving meal plan to Firebase for week:', weekStart)
      await saveMealPlan(weekStart, newMealPlan)
      console.log('App: Successfully saved meal plan to Firebase')
    } catch (error) {
      console.error('App: Error saving meal plan:', error)
    }
  }, [currentWeek, saveMealPlan])

  // Update meal plan and automatically save to Firebase
  const updateMealPlan = useCallback((updater: WeeklyMealPlan | ((prev: WeeklyMealPlan) => WeeklyMealPlan)) => {
    console.log('App: updateMealPlan called')
    setMealPlan(prev => {
      const newMealPlan = typeof updater === 'function' ? updater(prev) : updater
      console.log('App: New meal plan has', Object.values(newMealPlan).reduce((total, day) => total + Object.keys(day).length, 0), 'total meals')
      // Save to Firebase asynchronously
      saveMealPlanToFirebase(newMealPlan)
      return newMealPlan
    })
  }, [saveMealPlanToFirebase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  const handleReplaceMeal = (recipe: any) => {
    if (!selectedMealSlot) return
    
    console.log('App: handleReplaceMeal called for slot:', selectedMealSlot)
    
    const { dayIndex, mealType } = selectedMealSlot
    const targetCalories = Math.floor(2000) / 3 // TODO: Use actual profile values
    const recipeCalories = parseInt(recipe.nutrition_facts.calories) || 400
    let servings = targetCalories / recipeCalories
    servings = Math.max(0.5, Math.min(3, Math.round(servings * 2) / 2))
    
    console.log('App: Adding recipe', recipe.name, 'with', servings, 'servings to day', dayIndex, 'meal', mealType)
    
    updateMealPlan(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [mealType]: {
          recipe,
          servings,
          scheduledTime: prev[dayIndex]?.[mealType]?.scheduledTime || getDefaultMealTime(mealType, profile?.meal_times)
        }
      }
    }))
    
    setSelectedMealSlot(null)
    setCurrentView('meal-planning')
  }

  const renderView = () => {
    switch (currentView) {
      case 'recipes':
        return (
          <RecipesView 
            selectedMealSlot={selectedMealSlot}
            onReplaceMeal={handleReplaceMeal}
            onViewChange={setCurrentView}
          />
        )
      case 'meal-planning':
        return (
          <MealPlanningView 
            mealPlan={mealPlan}
            setMealPlan={updateMealPlan}
            currentWeek={currentWeek}
            setCurrentWeek={setCurrentWeek}
            globalStartDate={globalStartDate}
            setGlobalStartDate={setGlobalStartDate}
            onSelectMealSlot={setSelectedMealSlot}
            onViewChange={setCurrentView}
          />
        )
      case 'shopping':
        return (
          <ShoppingView 
            mealPlan={mealPlan}
            globalStartDate={globalStartDate}
            setGlobalStartDate={setGlobalStartDate}
          />
        )
      case 'profile':
        return <ProfileSettings />
      default:
        return <RecipesView />
    }
  }

  // Handle mood submission
  const handleMoodSubmit = async (moodData: any) => {
    console.log('Mood data submitted:', moodData)
    
    // TODO: Save mood data to your database
    // Example:
    // await supabase.from('mood_tracking').insert({
    //   user_id: user.id,
    //   energy: moodData.energy,
    //   mood: moodData.mood,
    //   context: moodData.context,
    //   notes: moodData.notes,
    //   meal_id: moodData.mealId,
    //   timestamp: moodData.timestamp
    // })
    
    // For now, just log it
    alert(`Mood tracked! Energy: ${moodData.energy}, Mood: ${moodData.mood}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      
      {/* Main Content */}
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="p-4 lg:p-6">
          {renderView()}
        </main>
      </div>

      {/* Quick-Vibe Overlay */}
      <QuickVibeOverlay
        isOpen={isQuickVibeOpen}
        onClose={() => setIsQuickVibeOpen(false)}
        onSubmit={handleMoodSubmit}
        mealId={quickVibeMealId}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App