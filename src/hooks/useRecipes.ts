import { useState, useEffect } from 'react'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Recipe } from '../types'
import { useAuth } from '../contexts/AuthContext'

export function useRecipes() {
  const { user } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !db) {
      setRecipes([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'recipes'),
      where('user_id', '==', user.uid)
    )

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const recipesData = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            user_id: data.user_id,
            name: data.name,
            description: data.description,
            prep_time: data.prep_time,
            cook_time: data.cook_time,
            servings: data.servings,
            ingredients: data.ingredients || [],
            directions: data.directions || [],
            nutrition_facts: data.nutrition_facts || {
              protein: '0g',
              fat: '0g',
              carbs: '0g',
              calories: '0'
            },
            tags: data.tags || [],
            is_favorite: data.is_favorite || false,
            created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString()
          }
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as Recipe[]
        
        setRecipes(recipesData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user])

  const addRecipe = async (recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !db) throw new Error('User not authenticated or database not available')

    try {
      await addDoc(collection(db, 'recipes'), {
        ...recipe,
        user_id: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      })
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add recipe')
    }
  }

  const updateRecipe = async (id: string, updates: Partial<Recipe>) => {
    if (!user || !db) throw new Error('User not authenticated or database not available')

    try {
      await updateDoc(doc(db, 'recipes', id), {
        ...updates,
        updated_at: serverTimestamp()
      })
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update recipe')
    }
  }

  const deleteRecipe = async (id: string) => {
    if (!user || !db) throw new Error('User not authenticated or database not available')

    try {
      await deleteDoc(doc(db, 'recipes', id))
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete recipe')
    }
  }

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    await updateRecipe(id, { is_favorite: isFavorite })
  }

  return {
    recipes,
    loading,
    error,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
    refetch: () => {} // Not needed with real-time updates
  }
}