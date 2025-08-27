import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { sampleRecipes } from '../data/sampleRecipes'
import { v4 as uuidv4 } from 'uuid'

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
        id: uuidv4(), // Generate new unique ID for user's copy
        tags: recipe.tags || [],
        user_id: userId,
        is_favorite: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      }
      
      // Remove the generated ID from the data sent to Firestore (Firestore will generate its own)
      const { id, ...recipeDataForFirestore } = recipeData
      
      const docRef = await addDoc(recipesCollection, recipeDataForFirestore)
      console.log(`Added recipe "${recipe.name}" with ID: ${docRef.id}`)
    }
    
    console.log(`Successfully populated ${sampleRecipes.length} recipes!`)
    return true
  } catch (error) {
    console.error('Error populating recipes:', error)
    return false
  }
}
