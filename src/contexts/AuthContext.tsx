import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { Profile } from '../types'

// Check if Firebase is properly configured
const isFirebaseConfigured = auth && db

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        await fetchProfile(user.uid)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const fetchProfile = async (userId: string) => {
    if (!db) return

    try {
      const profileDoc = await getDoc(doc(db, 'profiles', userId))
      
      if (profileDoc.exists()) {
        const data = profileDoc.data()
        setProfile({
          id: userId, // Use the document ID, not data.id
          email: data.email,
          full_name: data.full_name,
          daily_calorie_goal: data.daily_calorie_goal || 2000,
          meals_per_day: data.meals_per_day || 3,
          display_days: data.display_days || 7,
          default_recipes: data.default_recipes || {},
          meal_times: data.meal_times || {},
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString()
        })
      } else {
        // Profile doesn't exist, create it
        const user = auth.currentUser
        if (user) {
          const newProfile: Profile = {
            id: userId,
            email: user.email!,
            full_name: user.displayName || '',
            daily_calorie_goal: 2000,
            meals_per_day: 3,
            display_days: 7,
            default_recipes: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          await setDoc(doc(db, 'profiles', userId), {
            ...newProfile,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          })
          
          setProfile(newProfile)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not configured')
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!auth) throw new Error('Firebase not configured')
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(userCredential.user, { displayName: fullName })
  }

  const signOut = async () => {
    if (!auth) throw new Error('Firebase not configured')
    await firebaseSignOut(auth)
  }

  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (!user || !db) return

    await updateDoc(doc(db, 'profiles', user.uid), {
      ...updates,
      updated_at: serverTimestamp()
    })

    setProfile(prev => prev ? { ...prev, ...updates } : null)
  }

  const value = {
    user,
    profile,
    loading,
    isConfigured: isFirebaseConfigured,
    signIn,
    signUp,
    signOut,
    updateProfile: updateUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}