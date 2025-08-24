import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase with error handling
let app
let auth
let db

try {
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    console.warn('Firebase environment variables not configured. Please set up Firebase configuration.')
    // Create mock objects to prevent crashes
    auth = null
    db = null
  } else {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
  }
} catch (error) {
  console.error('Firebase initialization error:', error)
  auth = null
  db = null
}

export { auth, db }

export type Database = {
  profiles: {
    id: string
    email: string
    full_name: string
    daily_calorie_goal: number
    meals_per_day: number
    created_at: string
    updated_at: string
  }
  recipes: {
    id: string
    user_id: string
    title: string
    description: string
    ingredients: string[]
    instructions: string[]
    prep_time: number
    cook_time: number
    servings: number
    calories_per_serving: number
    protein: number
    carbs: number
    fat: number
    tags: string[]
    is_favorite: boolean
    created_at: string
    updated_at: string
  }
  meal_plans: {
    id: string
    user_id: string
    week_start: string
    meals: any[]
    shared_with: string[]
    created_at: string
    updated_at: string
  }
}