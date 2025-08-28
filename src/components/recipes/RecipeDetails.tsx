import { motion } from 'framer-motion'
import { Clock, Users, Heart, Trash2, Calendar, Plus, X, Tag } from 'lucide-react'
import { Recipe } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Input } from '../ui/Input'

interface RecipeDetailsProps {
  recipe: Recipe | null
  isOpen: boolean
  onClose: () => void
  onToggleFavorite?: (id: string, isFavorite: boolean) => void
  onDelete?: (id: string) => void
  onUpdateRecipe?: (id: string, updates: Partial<Recipe>) => void
  selectedMealSlot?: { dayIndex: number; mealType: string } | null
  onReplaceMeal?: (recipe: Recipe) => void
  onAddToMealPlan?: (recipe: Recipe) => void
  onReplaceRecipe?: () => void
  selectedMealType?: string | null
  onSelectDefaultRecipe?: (recipe: Recipe) => void
}

// Helper function to parse time strings for display
function parseTimeForDisplay(timeStr: string | number | undefined): string {
  if (!timeStr) return ''
  
  // If it's already a number, treat as minutes
  if (typeof timeStr === 'number') {
    return timeStr > 0 ? `${timeStr} minutes` : ''
  }
  
  // If it's a string, convert common abbreviations to full words
  const str = timeStr.toString()
  return str
    .replace(/mins?/g, 'minutes')
    .replace(/hrs?/g, 'hours')
    .replace(/secs?/g, 'seconds')
}
export function RecipeDetails({ 
  recipe, 
  isOpen, 
  onClose, 
  onToggleFavorite, 
  onDelete,
  onUpdateRecipe,
  selectedMealSlot,
  onReplaceMeal,
  onAddToMealPlan,
  onReplaceRecipe,
  selectedMealType,
  onSelectDefaultRecipe
}: RecipeDetailsProps) {
  const { profile } = useAuth()
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [tags, setTags] = useState<string[]>([])

  // Update local tags when recipe changes
  useEffect(() => {
    if (recipe) {
      setTags(recipe.tags || [])
    }
  }, [recipe])

  if (!recipe) return null

  // Use total_time if available, otherwise try to combine prep and cook times
  const getDisplayTime = () => {
    if (recipe.total_time) {
      return parseTimeForDisplay(recipe.total_time)
    }
    
    // If no total_time, try to combine prep_time and cook_time if they're numbers
    if (typeof recipe.prep_time === 'number' && typeof recipe.cook_time === 'number') {
      const total = (recipe.prep_time || 0) + (recipe.cook_time || 0)
      return total > 0 ? `${total} minutes` : ''
    }
    
    return ''
  }

  const handleDelete = async () => {
    if (!recipe || !onDelete) return
    
    if (confirm(`Are you sure you want to delete "${recipe.name}"? This action cannot be undone.`)) {
      await onDelete(recipe.id)
      onClose()
    }
  }

  const handleReplaceMeal = () => {
    if (!recipe || !onReplaceMeal) return
    onReplaceMeal(recipe)
    onClose()
  }

  const handleSelectAsDefault = () => {
    if (!recipe || !onSelectDefaultRecipe) return
    onSelectDefaultRecipe(recipe)
    onClose()
  }
  const handleAddTag = () => {
    const trimmedTag = newTag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const updatedTags = [...tags, trimmedTag]
      setTags(updatedTags)
      updateRecipeTags(updatedTags)
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove)
    setTags(updatedTags)
    updateRecipeTags(updatedTags)
  }

  const updateRecipeTags = async (updatedTags: string[]) => {
    if (recipe && onUpdateRecipe) {
      try {
        await onUpdateRecipe(recipe.id, { tags: updatedTags })
      } catch (error) {
        console.error('Error updating recipe tags:', error)
        // Revert local state on error
        setTags(recipe.tags || [])
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag()
    }
  }
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{recipe.name}</h1>
            <p className="text-gray-600 mb-4">{recipe.description}</p>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              {parseTimeForDisplay(recipe.prep_time) && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Prep: {parseTimeForDisplay(recipe.prep_time)}</span>
                </div>
              )}
              {parseTimeForDisplay(recipe.cook_time) && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Cook: {parseTimeForDisplay(recipe.cook_time)}</span>
                </div>
              )}
              {recipe.total_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Total: {parseTimeForDisplay(recipe.total_time)}</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{recipe.servings} servings</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {onToggleFavorite && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggleFavorite(recipe.id, !recipe.is_favorite)}
                className="p-2"
              >
                <Heart
                  className={`h-6 w-6 transition-colors ${
                    recipe.is_favorite 
                      ? 'text-red-500 fill-current' 
                      : 'text-gray-300 hover:text-red-500'
                  }`}
                />
              </motion.button>
            )}
            
            {onDelete && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDelete}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-6 w-6" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Nutrition Facts */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Nutrition Facts (per serving)</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {recipe.nutrition_facts.calories}
              </div>
              <div className="text-sm text-gray-500">calories</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-900">
                {recipe.nutrition_facts.protein}
              </div>
              <div className="text-sm text-gray-500">protein</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-900">
                {recipe.nutrition_facts.carbs}
              </div>
              <div className="text-sm text-gray-500">carbs</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-900">
                {recipe.nutrition_facts.fat}
              </div>
              <div className="text-sm text-gray-500">fat</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Ingredients */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Ingredients</h3>
            <div className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-2 bg-white rounded-md border border-gray-100"
                >
                  <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{ingredient.size}</span>
                    <span className="text-gray-600 ml-2">{ingredient.ingredient}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Directions */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Directions</h3>
            <div className="space-y-3">
              {recipe.directions.map((direction, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-3 p-3 bg-white rounded-md border border-gray-100"
                >
                  <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed">{direction.step_description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Tags</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingTags(!isEditingTags)}
            >
              <Tag className="h-4 w-4 mr-1" />
              {isEditingTags ? 'Done' : 'Edit Tags'}
            </Button>
          </div>
          
          <div className="space-y-3">
            {/* Existing Tags */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-emerald-100 text-emerald-800 rounded-full"
                >
                  <span>{tag}</span>
                  {isEditingTags && (
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 p-0.5 hover:bg-emerald-200 rounded-full transition-colors"
                      title="Remove tag"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {tags.length === 0 && (
                <span className="text-gray-500 text-sm italic">No tags added yet</span>
              )}
            </div>
            
            {/* Add New Tag */}
            {isEditingTags && (
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a new tag..."
                  className="flex-1"
                />
                <Button
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || tags.includes(newTag.trim())}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Meal Planning Actions */}
        {onAddToMealPlan && !selectedMealSlot && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Add to Meal Plan</h3>
              <p className="text-sm text-blue-700 mb-3">
                Add this recipe to your weekly meal plan
              </p>
              <Button onClick={() => onAddToMealPlan(recipe)} variant="secondary" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Add to Meal Plan
              </Button>
            </div>
          </div>
        )}

        {/* Replace Recipe Button (when viewing from meal planning) */}
        {onReplaceRecipe && !selectedMealSlot && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="font-medium text-orange-900 mb-2">Replace This Recipe</h3>
              <p className="text-sm text-orange-700 mb-3">
                Choose a different recipe for this meal slot
              </p>
              <Button onClick={onReplaceRecipe} variant="secondary" className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                Replace This Recipe
              </Button>
            </div>
          </div>
        )}

        {/* Replace Meal Button (when meal slot is selected) */}
        {selectedMealSlot && onReplaceMeal && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-emerald-50 rounded-lg p-4">
              <h3 className="font-medium text-emerald-900 mb-2">Replace Meal</h3>
              <p className="text-sm text-emerald-700 mb-3">
                Replace the selected meal slot with this recipe
              </p>
              <Button onClick={handleReplaceMeal} className="w-full">
                Replace with This Recipe
              </Button>
            </div>
          </div>
        )}
      </div>
        {/* Select as Default Recipe Button (when selecting default recipe) */}
        {selectedMealType && onSelectDefaultRecipe && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-medium text-purple-900 mb-2">Set as Default Recipe</h3>
              <p className="text-sm text-purple-700 mb-3">
                Set this recipe as the default for {selectedMealType}
              </p>
              <Button onClick={handleSelectAsDefault} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                Set as Default for {selectedMealType}
              </Button>
            </div>
          </div>
        )}
    </Modal>
  )
}