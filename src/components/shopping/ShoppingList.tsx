import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, ChevronDown, ChevronRight, Download } from 'lucide-react'
import { PlannedMeal, Recipe, ShoppingListItem, CategorizedShoppingList } from '../../types'
import { generateShoppingList, categorizeShoppingList } from '../../utils/shoppingList'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useState, useCallback } from 'react'

interface ShoppingListProps {
  meals: PlannedMeal[]
  recipes: Recipe[]
}

export function ShoppingList({ meals, recipes }: ShoppingListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [crossedOutItems, setCrossedOutItems] = useState<Set<string>>(new Set())
  
  const categorizedList = useMemo(() => {
    const items = generateShoppingList(meals, recipes)
    return categorizeShoppingList(items)
  }, [meals, recipes])

  const shoppingList = useMemo(() => {
    const items = generateShoppingList(meals, recipes)
    return items
  }, [meals, recipes])

  const toggleItemCrossOut = useCallback((itemKey: string) => {
    setCrossedOutItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey)
      } else {
        newSet.add(itemKey)
      }
      return newSet
    })
  }, [])

  // Define the order of categories
  const categoryOrder = [
    'Warzywa i owoce',
    'Nabiał, jaja, sery', 
    'Mięso i wędliny',
    'Ryby i owoce morza',
    'BIO',
    'Vege',
    'Alkohol',
    'Piekarnia, cukiernia',
    'Mrożone',
    'Spożywcze',
    'Słodycze i przekąski',
    'Bakalie, pestki, ziarna',
    'Kawa, herbata i kakao',
    'Napoje',
    'Dziecko',
    'Pomysły na prezent',
    'Artykuły biurowe',
    'Drogeria',
    'Środki czystości, chemia',
    'Dla zwierząt',
    'Dom, Ogród, Auto',
    'Zdrowie'
  ]

  // Get ordered categories that have items
  const orderedCategories = categoryOrder.filter(category => 
    categorizedList[category] && categorizedList[category].length > 0
  )

  if (shoppingList.length === 0) {
    return (
      <Card className="p-8 text-center">
        <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No items in your shopping list</h3>
        <p className="text-gray-600">Add meals to your weekly plan to generate a shopping list</p>
      </Card>
    )
  }

  const copyToClipboard = async () => {
    let listText = ''
    orderedCategories.forEach(category => {
      listText += `\n${category}:\n`
      categorizedList[category].forEach(item => {
        listText += `• ${item.quantity} ${item.unit} ${item.ingredient}\n`
      })
    })
    
    try {
      await navigator.clipboard.writeText(listText)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const exportToCSV = () => {
    // Create CSV content with headers
    let csvContent = 'Ingredient,Quantity,Unit,Used In\n'
    
    // Add each item as a CSV row
    shoppingList.forEach(item => {
      const ingredient = `"${item.ingredient.replace(/"/g, '""')}"`
      const quantity = `"${item.quantity}"`
      const unit = `"${item.unit}"`
      const recipes = `"${item.recipes.join(', ').replace(/"/g, '""')}"`
      
      csvContent += `${ingredient},${quantity},${unit},${recipes}\n`
    })
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `shopping-list-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const expandAll = () => {
    setExpandedCategories(new Set(orderedCategories))
  }

  const collapseAll = () => {
    setExpandedCategories(new Set())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Shopping List</h2>
          <p className="text-gray-600">{shoppingList.length} items for this week</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyToClipboard}>
            Copy List
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={expandAll}>
          Expand All
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          Collapse All
        </Button>
      </div>

      <div className="grid gap-3">
        {orderedCategories.map(category => (
          <Card key={category} className="overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-gray-900">{category}</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {categorizedList[category].length}
                </span>
              </div>
              {expandedCategories.has(category) ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedCategories.has(category) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-gray-100"
                >
                  <div className="p-4 space-y-3">
                    {categorizedList[category].map((item, index) => (
                      <motion.div
                        key={`${item.ingredient}-${item.unit}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ShoppingListItemComponent 
                          item={item} 
                          itemKey={`${item.ingredient}-${item.unit}`}
                          isCrossedOut={crossedOutItems.has(`${item.ingredient}-${item.unit}`)}
                          onToggleCrossOut={toggleItemCrossOut}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </div>
  )
}

interface ShoppingListItemProps {
  item: ShoppingListItem
  itemKey: string
  isCrossedOut: boolean
  onToggleCrossOut: (itemKey: string) => void
}

const ShoppingListItemComponent = ({ item, itemKey, isCrossedOut, onToggleCrossOut }: ShoppingListItemProps) => {
  return (
    <div className={`p-3 rounded-lg transition-colors ${
      isCrossedOut 
        ? 'bg-gray-100 opacity-60' 
        : 'bg-gray-50 hover:bg-gray-100'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isCrossedOut}
            onChange={() => onToggleCrossOut(itemKey)}
            className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
          />
        <div className="flex-1">
            <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <span className={`font-medium capitalize transition-all ${
                  isCrossedOut 
                    ? 'text-gray-500 line-through' 
                    : 'text-gray-900'
                }`}>
                {item.ingredient}
              </span>
                <span className={`transition-all ${
                  isCrossedOut 
                    ? 'text-gray-400 line-through' 
                    : 'text-gray-600'
                }`}>
                ({item.quantity} {item.unit})
              </span>
            </div>
          </div>
          
          <div className="mt-1">
              <p className={`text-xs transition-all ${
                isCrossedOut 
                  ? 'text-gray-400 line-through' 
                  : 'text-gray-500'
              }`}>
              Used in: {item.recipes.join(', ')}
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}