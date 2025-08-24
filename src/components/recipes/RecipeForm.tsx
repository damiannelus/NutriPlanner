import { useForm, useFieldArray } from 'react-hook-form'
import { Recipe } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Plus, X } from 'lucide-react'

interface RecipeFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  recipe?: Recipe
}

interface FormData {
  name: string
  description: string
  prep_time: number
  cook_time: number
  total_time: number
  servings: number
  ingredients: { ingredient: string; size: string }[]
  directions: { step_description: string }[]
  nutrition_facts: {
    protein: string
    fat: string
    carbs: string
    calories: string
  }
  tags: string
}

export function RecipeForm({ isOpen, onClose, onSave, recipe }: RecipeFormProps) {
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<FormData>({
    defaultValues: {
      name: recipe?.name || '',
      description: recipe?.description || '',
      prep_time: recipe?.prep_time || 0,
      cook_time: recipe?.cook_time || 0,
      total_time: recipe?.total_time || 0,
      servings: recipe?.servings || 1,
      ingredients: recipe?.ingredients || [{ ingredient: '', size: '' }],
      directions: recipe?.directions || [{ step_description: '' }],
      nutrition_facts: recipe?.nutrition_facts || {
        protein: '',
        fat: '',
        carbs: '',
        calories: ''
      },
      tags: recipe?.tags.join(', ') || ''
    }
  })

  const { 
    fields: ingredientFields, 
    append: appendIngredient, 
    remove: removeIngredient 
  } = useFieldArray({
    control,
    name: 'ingredients'
  })

  const { 
    fields: instructionFields, 
    append: appendInstruction, 
    remove: removeInstruction 
  } = useFieldArray({
    control,
    name: 'directions'
  })

  const onSubmit = async (data: FormData) => {
    const recipeData = {
      name: data.name,
      description: data.description,
      prep_time: data.prep_time,
      cook_time: data.cook_time,
      total_time: data.total_time,
      servings: data.servings,
      ingredients: data.ingredients.filter(ing => ing.ingredient && ing.size),
      directions: data.directions.filter(dir => dir.step_description),
      nutrition_facts: data.nutrition_facts,
      tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      is_favorite: recipe?.is_favorite || false
    }

    await onSave(recipeData)
    reset()
    onClose()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={recipe ? 'Edit Recipe' : 'Add New Recipe'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <Input
            label="Recipe Name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
            placeholder="Enter recipe name"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Brief description of the recipe"
            />
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recipe Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prep Time (minutes)"
                type="number"
                {...register('prep_time', { min: 0 })}
                placeholder="e.g., 15"
              />
              <Input
                label="Cook Time (minutes)"
                type="number"
                {...register('cook_time', { min: 0 })}
                placeholder="e.g., 30"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                label="Total Time (minutes)"
                type="number"
                {...register('total_time', { min: 0 })}
                placeholder="e.g., 45"
                helperText="Leave blank to auto-calculate from prep + cook time"
              />
              <Input
                label="Servings"
                type="number"
                {...register('servings', { required: 'Servings is required', min: 1 })}
                error={errors.servings?.message}
                placeholder="e.g., 4"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Ingredients
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => appendIngredient({ ingredient: '', size: '' })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {ingredientFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <div className="flex gap-2 flex-1">
                    <Input
                      {...register(`ingredients.${index}.ingredient` as const, {
                        required: 'Ingredient is required'
                      })}
                      placeholder="e.g., flour"
                      className="flex-1"
                    />
                    <Input
                      {...register(`ingredients.${index}.size` as const, {
                        required: 'Size is required'
                      })}
                      placeholder="e.g., 2 cups"
                      className="w-32"
                    />
                  </div>
                  {ingredientFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                      className="text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Directions
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => appendInstruction({ step_description: '' })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {instructionFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-medium mt-1">
                    {index + 1}
                  </div>
                  <textarea
                    {...register(`directions.${index}.step_description` as const, {
                      required: 'Direction is required'
                    })}
                    rows={2}
                    placeholder="Describe this step"
                    className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  {instructionFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInstruction(index)}
                      className="text-red-600 mt-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nutrition Facts</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Calories"
                {...register('nutrition_facts.calories', { required: 'Calories is required' })}
                error={errors.nutrition_facts?.calories?.message}
                placeholder="e.g., 175"
              />
              <Input
                label="Protein"
                {...register('nutrition_facts.protein', { required: 'Protein is required' })}
                error={errors.nutrition_facts?.protein?.message}
                placeholder="e.g., 5g"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                label="Carbs"
                {...register('nutrition_facts.carbs', { required: 'Carbs is required' })}
                error={errors.nutrition_facts?.carbs?.message}
                placeholder="e.g., 15g"
              />
              <Input
                label="Fat"
                {...register('nutrition_facts.fat', { required: 'Fat is required' })}
                error={errors.nutrition_facts?.fat?.message}
                placeholder="e.g., 11g"
              />
            </div>
          </div>

          <Input
            label="Tags (comma separated)"
            {...register('tags')}
            placeholder="e.g., vegetarian, quick, kid-friendly"
            helperText="Add tags to help organize and search your recipes"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            {recipe ? 'Update Recipe' : 'Save Recipe'}
          </Button>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}