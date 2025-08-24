import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { sampleRecipes } from '../data/sampleRecipes'

export async function populateRecipes(userId: string) {
  if (!db) {
    console.error('Database not available')
    return false
  }

  try {
    console.log('Starting to populate recipes...')
    
    const recipesCollection = collection(db, 'recipes')
    
    for (const recipe of sampleRecipes) {
      const recipeData = {
        ...recipe,
        tags: recipe.tags || [],
        user_id: userId,
        is_favorite: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      }
      
      const docRef = await addDoc(recipesCollection, recipeData)
      console.log(`Added recipe "${recipe.name}" with ID: ${docRef.id}`)
    }
    
    console.log(`Successfully populated ${sampleRecipes.length} recipes!`)
    return true
  } catch (error) {
    console.error('Error populating recipes:', error)
    return false
  }
}
