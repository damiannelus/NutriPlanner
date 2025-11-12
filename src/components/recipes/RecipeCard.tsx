import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Clock, Users, CreditCard as Edit, Trash2 } from 'lucide-react'
import { Recipe } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface RecipeCardProps {
  recipe: Recipe
  onToggleFavorite: (id: string, isFavorite: boolean) => void
  onEdit: (recipe: Recipe) => void
  onDelete: (id: string) => void
  onAddToPlan?: (recipe: Recipe) => void
  onViewDetails?: (recipe: Recipe) => void
  onReplaceMeal?: (recipe: Recipe) => void
  showReplaceMeal?: boolean
}

// Helper function to parse time strings and convert to display format
function parseTimeString(timeStr: string | number | undefined): string {
  if (!timeStr) return 'N/A'
  
  // If it's already a number, treat as minutes
  if (typeof timeStr === 'number') {
    return timeStr > 0 ? `${timeStr}m` : 'N/A'
  }
  
  // If it's a string, return as-is (it's already formatted)
  return timeStr.toString()
}
export function RecipeCard({ 
  recipe, 
  onToggleFavorite, 
  onEdit, 
  onDelete,
  onAddToPlan,
  onViewDetails,
  onReplaceMeal,
  showReplaceMeal = false
}: RecipeCardProps) {
  const [showActions, setShowActions] = useState(false)

  // Use total_time if available, otherwise try to combine prep and cook times
  const getDisplayTime = () => {
    if (recipe.total_time) {
      return parseTimeString(recipe.total_time)
    }
    
    // If no total_time, try to combine prep_time and cook_time if they're numbers
    if (typeof recipe.prep_time === 'number' && typeof recipe.cook_time === 'number') {
      const total = (recipe.prep_time || 0) + (recipe.cook_time || 0)
      return total > 0 ? `${total}m` : 'N/A'
    }
    
    // If prep_time and cook_time are strings, just show prep_time or 'N/A'
    return parseTimeString(recipe.prep_time) || 'N/A'
  }

  return (
    <Card 
      className="group relative lg:hover:shadow-md transition-shadow"
      onClick={() => onViewDetails?.(recipe)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="p-4 lg:p-6">
        <div className="flex items-start justify-between mb-2 lg:mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-base lg:text-lg mb-1 lg:mb-2 line-clamp-2">{recipe.name}</h3>
            <p className="text-gray-600 text-sm mb-2 lg:mb-4 line-clamp-2 hidden lg:block">{recipe.description}</p>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onToggleFavorite(recipe.id, !recipe.is_favorite)}
            className="ml-2 p-2 lg:p-1"
          >
            <Heart
              className={`h-6 w-6 lg:h-5 lg:w-5 transition-colors ${
                recipe.is_favorite 
                  ? 'text-red-500 fill-current' 
                  : 'text-gray-300 hover:text-red-500'
              }`}
            />
          </motion.button>
        </div>

        <div className="flex items-center gap-3 lg:gap-4 text-sm text-gray-500 mb-3 lg:mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{getDisplayTime()}</span>
          </div>
          {recipe.servings && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{recipe.servings} servings</span>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-2 lg:p-3 mb-3 lg:mb-4">
          <div className="grid grid-cols-4 gap-1 lg:gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-gray-900">{recipe.nutrition_facts.calories}</div>
              <div className="text-gray-500 hidden lg:block">calories</div>
              <div className="text-gray-500 lg:hidden">cal</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{recipe.nutrition_facts.protein}</div>
              <div className="text-gray-500 hidden lg:block">protein</div>
              <div className="text-gray-500 lg:hidden">prot</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{recipe.nutrition_facts.carbs}</div>
              <div className="text-gray-500">carbs</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{recipe.nutrition_facts.fat}</div>
              <div className="text-gray-500 hidden lg:block">fat</div>
              <div className="text-gray-500 lg:hidden">fat</div>
            </div>
          </div>
        </div>

        {recipe.tags.length > 0 && recipe.tags.slice(0, 3).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full"
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Desktop Actions */}
        <motion.div
          className="hidden lg:flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: showActions ? 1 : 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {onAddToPlan && !showReplaceMeal && (
            <Button
              size="sm"
              onClick={() => onAddToPlan(recipe)}
              className="flex-1"
            >
              Add to Plan
            </Button>
          )}
          {onReplaceMeal && showReplaceMeal && (
            <Button
              size="sm"
              onClick={() => onReplaceMeal(recipe)}
              className="flex-1"
            >
              Replace Meal
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(recipe)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(recipe.id)}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Mobile Actions - Always visible */}
        <div className="lg:hidden flex gap-2" onClick={(e) => e.stopPropagation()}>
          {onAddToPlan && !showReplaceMeal && (
            <Button
              size="sm"
              onClick={() => onAddToPlan(recipe)}
              className="flex-1"
            >
              Add to Plan
            </Button>
          )}
          {onReplaceMeal && showReplaceMeal && (
            <Button
              size="sm"
              onClick={() => onReplaceMeal(recipe)}
              className="flex-1"
            >
              Replace Meal
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}