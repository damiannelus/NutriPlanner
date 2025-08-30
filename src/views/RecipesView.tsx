import { useState, useEffect } from 'react'
import { format, startOfWeek } from 'date-fns'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Heart, Loader2 } from 'lucide-react'
import { useRecipes } from '../hooks/useRecipes'
import { Recipe } from '../types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { RecipeCard } from '../components/recipes/RecipeCard'
import { RecipeForm } from '../components/recipes/RecipeForm'
import { RecipeDetails } from '../components/recipes/RecipeDetails'

interface RecipesViewProps {
  selectedMealSlot?: {
    dayIndex: number
    mealType: string
  } | null
  onReplaceMeal?: (recipe: Recipe) => void
  onViewChange?: (view: string) => void
  selectedMealType?: string | null
  onSelectDefaultRecipe?: (recipe: Recipe) => void
}

export function RecipesView({ selectedMealSlot, onReplaceMeal, onViewChange, selectedMealType, onSelectDefaultRecipe }: RecipesViewProps) {
  const { recipes, loading, addRecipe, updateRecipe, deleteRecipe, toggleFavorite } = useRecipes()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | undefined>()
  const [searchTerm, setSearchTerm] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [minPrepTime, setMinPrepTime] = useState('')
  const [maxPrepTime, setMaxPrepTime] = useState('')
  const [minCalories, setMinCalories] = useState('')
  const [maxCalories, setMaxCalories] = useState('')
  const [minServings, setMinServings] = useState('')
  const [maxServings, setMaxServings] = useState('')
  const [selectedRecipeForDetails, setSelectedRecipeForDetails] = useState<Recipe | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'calories' | 'protein' | 'carbs' | 'fat'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isFiltering, setIsFiltering] = useState(false)
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null)
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('')

  const showReplaceMeal = !!selectedMealSlot && !!onReplaceMeal
  const showSelectDefault = !!selectedMealType && !!onSelectDefaultRecipe

  // Add keyboard shortcut for focusing search
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only trigger shortcut if not typing in an input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLSelectElement) {
        return
      }

      // Prevent shortcut when modals or forms are open
      if (document.querySelector('[role="dialog"]') || 
          document.querySelector('.modal') ||
          isFormOpen ||
          selectedRecipeForDetails) {
        return
      }

      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        searchInputRef?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [searchInputRef, isFormOpen, selectedRecipeForDetails])

  // Add loading state for filtering
  useEffect(() => {
    setIsFiltering(true)
    const timer = setTimeout(() => {
      setIsFiltering(false)
    }, 100) // Small delay to show loading state

    return () => clearTimeout(timer)
  }, [searchTerm, showFavoritesOnly, selectedTags, selectedIngredients, minPrepTime, maxPrepTime, minCalories, maxCalories, minServings, maxServings, sortBy, sortOrder])

  // Get all unique tags
  const allTags = Array.from(
    new Set(recipes.flatMap(recipe => recipe.tags))
  ).sort()

  // Get all unique ingredients
  const allIngredients = Array.from(
    new Set(recipes.flatMap(recipe => 
      recipe.ingredients.map(ing => ing.ingredient.toLowerCase().trim())
    ))
  ).filter(Boolean).sort()

  // Filter ingredients based on search term
  const filteredIngredients = allIngredients.filter(ingredient =>
    ingredient.toLowerCase().includes(ingredientSearchTerm.toLowerCase())
  )
  // Helper function to parse time string to minutes for comparison
  const parseTimeToMinutes = (timeStr: string | number | undefined): number => {
    if (!timeStr) return 0
    if (typeof timeStr === 'number') return timeStr
    
    const str = timeStr.toString().toLowerCase()
    let totalMinutes = 0
    
    // Parse hours
    const hoursMatch = str.match(/(\d+)\s*hrs?/)
    if (hoursMatch) {
      totalMinutes += parseInt(hoursMatch[1]) * 60
    }
    
    // Parse minutes
    const minutesMatch = str.match(/(\d+)\s*mins?/)
    if (minutesMatch) {
      totalMinutes += parseInt(minutesMatch[1])
    }
    
    return totalMinutes
  }

  // Helper function to extract numeric value from nutrition string
  const parseNutritionValue = (value: string): number => {
    if (!value) return 0
    const numericValue = parseFloat(String(value).replace(/[^\d.]/g, ''))
    return isNaN(numericValue) ? 0 : numericValue
  }

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = (recipe.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (recipe.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFavorites = !showFavoritesOnly || recipe.is_favorite
    
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => recipe.tags.includes(tag))
    
    const matchesIngredients = selectedIngredients.length === 0 ||
                              selectedIngredients.every(selectedIngredient =>
                                recipe.ingredients.some(recipeIngredient =>
                                  recipeIngredient.ingredient.toLowerCase().includes(selectedIngredient.toLowerCase())
                                )
                              )
    
    // Parse prep time for filtering (use total_time if prep_time not available)
    const prepTimeMinutes = parseTimeToMinutes(recipe.prep_time || recipe.total_time)
    const matchesMinPrepTime = !minPrepTime || prepTimeMinutes >= parseInt(minPrepTime)
    const matchesMaxPrepTime = !maxPrepTime || prepTimeMinutes <= parseInt(maxPrepTime)
    
    // Parse calories for filtering
    const recipeCalories = parseInt(recipe.nutrition_facts.calories) || 0
    const matchesMinCalories = !minCalories || recipeCalories >= parseInt(minCalories)
    const matchesMaxCalories = !maxCalories || recipeCalories <= parseInt(maxCalories)
    
    // Parse servings for filtering
    const recipeServings = recipe.servings || 0
    const matchesMinServings = !minServings || recipeServings >= parseInt(minServings)
    const matchesMaxServings = !maxServings || recipeServings <= parseInt(maxServings)
    
    return matchesSearch && matchesFavorites && matchesTags && matchesIngredients &&
           matchesMinPrepTime && matchesMaxPrepTime &&
           matchesMinCalories && matchesMaxCalories &&
           matchesMinServings && matchesMaxServings
  })

  // Sort recipes
  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string

    switch (sortBy) {
      case 'calories':
        aValue = parseNutritionValue(a.nutrition_facts.calories)
        bValue = parseNutritionValue(b.nutrition_facts.calories)
        break
      case 'protein':
        aValue = parseNutritionValue(a.nutrition_facts.protein)
        bValue = parseNutritionValue(b.nutrition_facts.protein)
        break
      case 'carbs':
        aValue = parseNutritionValue(a.nutrition_facts.carbs)
        bValue = parseNutritionValue(b.nutrition_facts.carbs)
        break
      case 'fat':
        aValue = parseNutritionValue(a.nutrition_facts.fat)
        bValue = parseNutritionValue(b.nutrition_facts.fat)
        break
      default: // name
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    } else {
      const numA = aValue as number
      const numB = bValue as number
      return sortOrder === 'asc' ? numA - numB : numB - numA
    }
  })

  const handleSaveRecipe = async (recipeData: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (selectedRecipe) {
      await updateRecipe(selectedRecipe.id, recipeData)
    } else {
      await addRecipe(recipeData)
    }
  }

  const handleEditRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setIsFormOpen(true)
  }

  const handleViewRecipeDetails = (recipe: Recipe) => {
    setSelectedRecipeForDetails(recipe)
  }

  const handleDeleteRecipe = async (id: string) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      await deleteRecipe(id)
    }
  }

  const openNewRecipeForm = () => {
    setSelectedRecipe(undefined)
    setIsFormOpen(true)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredient) 
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Recipes</h1>
          {showReplaceMeal ? (
            <p className="text-emerald-600 font-medium">
              Select a recipe to replace the selected meal
            </p>
          ) : showSelectDefault ? (
            <p className="text-purple-600 font-medium">
              Select a default recipe for {selectedMealType}
            </p>
          ) : (
            <p className="text-gray-600">
              {recipes.length} recipes • {recipes.filter(r => r.is_favorite).length} favorites
            </p>
          )}
        </div>
        
        {!showReplaceMeal && !showSelectDefault && (
          <Button onClick={openNewRecipeForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Recipe
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              ref={setSearchInputRef}
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-4">
            {/* Time and Calorie Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prep Time (minutes)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrepTime}
                    onChange={(e) => setMinPrepTime(e.target.value)}
                    className="flex-1"
                  />
                  <span className="flex items-center text-gray-500">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrepTime}
                    onChange={(e) => setMaxPrepTime(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calories per serving
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minCalories}
                    onChange={(e) => setMinCalories(e.target.value)}
                    className="flex-1"
                  />
                  <span className="flex items-center text-gray-500">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxCalories}
                    onChange={(e) => setMaxCalories(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servings
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minServings}
                    onChange={(e) => setMinServings(e.target.value)}
                    className="flex-1"
                  />
                  <span className="flex items-center text-gray-500">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxServings}
                    onChange={(e) => setMaxServings(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Other Filters */}
            <div className="flex flex-wrap items-center gap-4">
            <Button
              variant={showFavoritesOnly ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Heart className="h-4 w-4 mr-2" />
              Favorites Only
            </Button>

            {allTags.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Tags:</span>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Ingredient Filter */}
          {allIngredients.length > 0 && (
            <div className="flex items-start gap-2">
              <Filter className="h-4 w-4 text-gray-600 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Ingredients:</span>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                    <input
                      type="text"
                      placeholder="Search ingredients..."
                      value={ingredientSearchTerm}
                      onChange={(e) => setIngredientSearchTerm(e.target.value)}
                      className="pl-7 pr-3 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent w-40"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {filteredIngredients.map(ingredient => (
                    <button
                      key={ingredient}
                      onClick={() => toggleIngredient(ingredient)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors capitalize ${
                        selectedIngredients.includes(ingredient)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {ingredient}
                    </button>
                  ))}
                  {ingredientSearchTerm && filteredIngredients.length === 0 && (
                    <div className="text-xs text-gray-500 italic py-2">
                      No ingredients found matching "{ingredientSearchTerm}"
                    </div>
                    {selectedIngredients.length > 0 && (
                      <button
                        onClick={() => setSelectedIngredients([])}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                        title="Clear ingredient filter"
                      >
                        Clear
                      </button>
                    )}
                  )}
                </div>
                {selectedIngredients.length > 0 && (
                  <div className="mt-2 text-xs text-blue-600">
                    Showing recipes with: {selectedIngredients.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sorting Options */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="calories">Calories</option>
              <option value="protein">Protein</option>
              <option value="carbs">Carbs</option>
              <option value="fat">Fat</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Recipes Grid */}
      {loading || isFiltering ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-4" />
            <p className="text-gray-600">
              {loading ? 'Loading recipes...' : 'Filtering recipes...'}
            </p>
          </div>
        </Card>
      ) : sortedRecipes.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {recipes.length === 0 ? 'No recipes yet' : 'No recipes match your filters'}
            </h3>
            <p className="text-gray-600 mb-6">
              {recipes.length === 0 
                ? 'Start building your recipe library by adding your first recipe'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {recipes.length === 0 && (
              <Button onClick={openNewRecipeForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Recipe
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <RecipeCard
                recipe={recipe}
                onToggleFavorite={toggleFavorite}
                onEdit={handleEditRecipe}
                onDelete={handleDeleteRecipe}
                onViewDetails={handleViewRecipeDetails}
                onReplaceMeal={onReplaceMeal}
                showReplaceMeal={showReplaceMeal}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Recipe Form Modal */}
      <RecipeForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveRecipe}
        recipe={selectedRecipe}
      />

      {/* Recipe Details Modal */}
      <RecipeDetails
        recipe={selectedRecipeForDetails}
        isOpen={!!selectedRecipeForDetails}
        onClose={() => setSelectedRecipeForDetails(null)}
        onToggleFavorite={toggleFavorite}
        onDelete={handleDeleteRecipe}
        onUpdateRecipe={updateRecipe}
        selectedMealSlot={selectedMealSlot}
        onReplaceMeal={onReplaceMeal}
        onAddToMealPlan={onReplaceMeal}
        selectedMealType={selectedMealType}
        onSelectDefaultRecipe={onSelectDefaultRecipe}
      />
    </div>
  )
}