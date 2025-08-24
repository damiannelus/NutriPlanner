import { PlannedMeal, Recipe, ShoppingListItem } from '../types'

// Polish ingredient categories
const INGREDIENT_CATEGORIES = {
  'Warzywa i owoce': [
    'tomato', 'onion', 'garlic', 'carrot', 'potato', 'bell pepper', 'cucumber', 'lettuce', 'spinach', 'broccoli',
    'cauliflower', 'zucchini', 'eggplant', 'mushroom', 'celery', 'leek', 'cabbage', 'kale', 'avocado', 'corn',
    'peas', 'beans', 'lemon', 'lime', 'orange', 'apple', 'banana', 'berries', 'strawberry', 'blueberry',
    'raspberry', 'grape', 'pineapple', 'mango', 'peach', 'pear', 'cherry', 'plum', 'watermelon', 'melon',
    'pomidor', 'cebula', 'czosnek', 'marchew', 'ziemniak', 'papryka', 'ogórek', 'sałata', 'szpinak', 'brokuł',
    'kalafior', 'cukinia', 'bakłażan', 'pieczarka', 'seler', 'por', 'kapusta', 'jarmuż', 'awokado', 'kukurydza',
    'groszek', 'fasola', 'cytryna', 'limonka', 'pomarańcza', 'jabłko', 'banan', 'jagody', 'truskawka', 'borówka',
    'malina', 'winogrono', 'ananas', 'mango', 'brzoskwinia', 'gruszka', 'wiśnia', 'śliwka', 'arbuz', 'melon',
    'vegetable', 'fruit', 'fresh', 'organic'
  ],
  'Nabiał, jaja, sery': [
    'milk', 'cream', 'butter', 'yogurt', 'cheese', 'egg', 'sour cream', 'cottage cheese', 'mozzarella',
    'parmesan', 'cheddar', 'feta', 'ricotta', 'cream cheese', 'heavy cream', 'half and half',
    'mleko', 'śmietana', 'masło', 'jogurt', 'ser', 'jajko', 'śmietana kwaśna', 'twaróg', 'mozzarella',
    'parmezan', 'cheddar', 'feta', 'ricotta', 'serek śmietankowy', 'śmietanka', 'jaja', 'dairy'
  ],
  'Mięso i wędliny': [
    'chicken', 'beef', 'pork', 'turkey', 'lamb', 'bacon', 'ham', 'sausage', 'ground beef', 'ground turkey',
    'ground chicken', 'steak', 'roast', 'chops', 'ribs', 'wings', 'thighs', 'breast', 'tenderloin',
    'kurczak', 'wołowina', 'wieprzowina', 'indyk', 'jagnięcina', 'bekon', 'szynka', 'kiełbasa', 'mielona wołowina',
    'mielony indyk', 'mielony kurczak', 'stek', 'pieczeń', 'kotlety', 'żeberka', 'skrzydełka', 'udka', 'pierś', 'polędwica',
    'meat', 'poultry'
  ],
  'Ryby i owoce morza': [
    'salmon', 'tuna', 'cod', 'tilapia', 'shrimp', 'crab', 'lobster', 'scallops', 'mussels', 'clams',
    'fish', 'seafood', 'anchovy', 'sardine', 'mackerel', 'trout', 'halibut', 'sole', 'flounder',
    'łosoś', 'tuńczyk', 'dorsz', 'tilapia', 'krewetki', 'krab', 'homar', 'przegrzebki', 'małże', 'ostrygi',
    'ryba', 'owoce morza', 'anchois', 'sardynka', 'makrela', 'pstrąg', 'halibut', 'sola', 'flądra',
    'seafood', 'fish'
  ],
  'BIO': [
    'bio', 'organic', 'organiczny', 'ekologiczny', 'eko'
  ],
  'Vege': [
    'vege', 'vegan', 'vegetarian', 'wegański', 'wegetariański', 'tofu', 'tempeh', 'seitan',
    'plant based', 'roślinny'
  ],
  'Alkohol': [
    'beer', 'wine', 'vodka', 'whiskey', 'rum', 'gin', 'brandy', 'liqueur', 'champagne',
    'piwo', 'wino', 'wódka', 'whisky', 'rum', 'gin', 'brandy', 'likier', 'szampan',
    'alcohol', 'alkohol'
  ],
  'Piekarnia, cukiernia': [
    'bread', 'flour', 'sugar', 'baking powder', 'baking soda', 'yeast', 'vanilla', 'cocoa', 'chocolate',
    'cake', 'cookie', 'pastry', 'croissant', 'bagel', 'muffin', 'donut', 'pie', 'tart', 'roll',
    'chleb', 'mąka', 'cukier', 'proszek do pieczenia', 'soda oczyszczona', 'drożdże', 'wanilia', 'kakao', 'czekolada',
    'ciasto', 'ciastko', 'ciasteczko', 'croissant', 'bajgiel', 'muffin', 'pączek', 'placek', 'tarta', 'bułka',
    'bakery', 'piekarnia'
  ],
  'Mrożone': [
    'frozen', 'ice cream', 'frozen vegetables', 'frozen fruit', 'frozen pizza', 'frozen meals',
    'mrożone', 'lody', 'mrożone warzywa', 'mrożone owoce', 'mrożona pizza', 'mrożone posiłki'
  ],
  'Spożywcze': [
    'rice', 'pasta', 'noodles', 'quinoa', 'oats', 'cereal', 'crackers', 'chips', 'nuts', 'seeds',
    'oil', 'vinegar', 'salt', 'pepper', 'spices', 'herbs', 'sauce', 'ketchup', 'mustard', 'mayo',
    'honey', 'jam', 'peanut butter', 'olive oil', 'coconut oil', 'soy sauce', 'hot sauce', 'salsa',
    'ryż', 'makaron', 'kluski', 'quinoa', 'owies', 'płatki', 'krakersy', 'chipsy', 'orzechy', 'nasiona',
    'olej', 'ocet', 'sól', 'pieprz', 'przyprawy', 'zioła', 'sos', 'ketchup', 'musztarda', 'majonez',
    'miód', 'dżem', 'masło orzechowe', 'oliwa', 'olej kokosowy', 'sos sojowy', 'sos ostry', 'salsa',
    'grocery', 'food'
  ],
  'Słodycze i przekąski': [
    'candy', 'chocolate', 'cookies', 'chips', 'popcorn', 'pretzels', 'crackers', 'granola bar',
    'słodycze', 'czekolada', 'ciasteczka', 'chipsy', 'popcorn', 'precelki', 'krakersy', 'baton',
    'snack', 'sweet', 'przekąska'
  ],
  'Bakalie, pestki, ziarna': [
    'almonds', 'walnuts', 'cashews', 'peanuts', 'pistachios', 'sunflower seeds', 'pumpkin seeds',
    'chia seeds', 'flax seeds', 'sesame seeds', 'pine nuts', 'pecans', 'hazelnuts', 'brazil nuts',
    'migdały', 'orzechy włoskie', 'nerkowce', 'orzeszki ziemne', 'pistacje', 'nasiona słonecznika',
    'pestki dyni', 'nasiona chia', 'siemię lniane', 'sezam', 'orzeszki piniowe', 'pekan', 'orzechy laskowe',
    'nuts', 'seeds', 'dried fruit'
  ],
  'Kawa, herbata i kakao': [
    'coffee', 'tea', 'cocoa', 'hot chocolate', 'espresso', 'cappuccino', 'latte', 'green tea', 'black tea',
    'kawa', 'herbata', 'kakao', 'gorąca czekolada', 'espresso', 'cappuccino', 'latte', 'zielona herbata', 'czarna herbata'
  ],
  'Napoje': [
    'water', 'juice', 'soda', 'beer', 'wine', 'coffee', 'tea', 'energy drink', 'sports drink',
    'woda', 'sok', 'napój gazowany', 'napój energetyczny', 'napój sportowy', 'beverage', 'drink'
  ],
  'Dziecko': [
    'baby', 'dziecko', 'niemowlę', 'baby food', 'formula', 'diapers', 'pieluszki', 'mleko modyfikowane'
  ],
  'Pomysły na prezent': [
    'gift', 'present', 'prezent', 'gift card', 'voucher', 'bon'
  ],
  'Artykuły biurowe': [
    'office', 'biuro', 'paper', 'pen', 'pencil', 'notebook', 'papier', 'długopis', 'ołówek', 'zeszyt'
  ],
  'Drogeria': [
    'cosmetics', 'shampoo', 'soap', 'toothpaste', 'deodorant', 'perfume',
    'kosmetyki', 'szampon', 'mydło', 'pasta do zębów', 'dezodorant', 'perfumy', 'drogeria'
  ],
  'Środki czystości, chemia': [
    'cleaning', 'detergent', 'soap', 'bleach', 'disinfectant',
    'środki czystości', 'detergent', 'mydło', 'wybielacz', 'dezynfekcja', 'chemia'
  ],
  'Dla zwierząt': [
    'pet', 'dog', 'cat', 'animal', 'pet food',
    'zwierzę', 'pies', 'kot', 'karma', 'dla zwierząt'
  ],
  'Dom, Ogród, Auto': [
    'home', 'garden', 'car', 'auto', 'tools', 'plants',
    'dom', 'ogród', 'auto', 'samochód', 'narzędzia', 'rośliny'
  ],
  'Zdrowie': [
    'health', 'medicine', 'vitamins', 'supplements', 'pharmacy',
    'zdrowie', 'leki', 'witaminy', 'suplementy', 'apteka'
  ]
}

function categorizeIngredient(ingredientName: string): string {
  const lowerName = ingredientName.toLowerCase()
  
  for (const [category, keywords] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category
    }
  }
  
  return 'Spożywcze' // Default category
}

export interface CategorizedShoppingList {
  [category: string]: ShoppingListItem[]
}

export function generateShoppingList(meals: PlannedMeal[], recipes: Recipe[]): ShoppingListItem[] {
  const ingredientMap = new Map<string, {
    quantity: number
    unit: string
    recipes: string[]
  }>()

  meals.forEach(meal => {
    const recipe = recipes.find(r => r.id === meal.recipe_id)
    if (!recipe) return

    const servingMultiplier = meal.servings

    recipe.ingredients.forEach(ingredient => {
      // Parse ingredient object with size and ingredient name
      const sizeStr = (ingredient.size || '').trim()
      const ingredientName = (ingredient.ingredient || '').trim()
      
      // Extract quantity and unit from size (e.g., "2 cups" or "1 lb")
      const parts = sizeStr.split(' ')
      if (parts.length < 1) return

      const quantityStr = parts[0]
      const unit = parts.slice(1).join(' ') || 'piece'

      // Convert fractions and mixed numbers to decimals
      const quantity = parseQuantity(quantityStr) * servingMultiplier

      const key = `${ingredientName.toLowerCase()}_${unit}`
      
      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!
        existing.quantity += quantity
        existing.recipes.push(recipe.name)
      } else {
        ingredientMap.set(key, {
          quantity,
          unit,
          recipes: [recipe.name]
        })
      }
    })
  })

  return Array.from(ingredientMap.entries()).map(([key, data]) => {
    const ingredientName = key.split('_').slice(0, -1).join('_')
    return {
      ingredient: ingredientName.replace(/_/g, ' '),
      quantity: formatQuantity(data.quantity),
      unit: data.unit,
      recipes: [...new Set(data.recipes)] // Remove duplicates
    }
  }).sort((a, b) => a.ingredient.localeCompare(b.ingredient))
}

export function categorizeShoppingList(items: ShoppingListItem[]): CategorizedShoppingList {
  const categorized: CategorizedShoppingList = {}
  
  items.forEach(item => {
    const category = categorizeIngredient(item.ingredient)
    if (!categorized[category]) {
      categorized[category] = []
    }
    categorized[category].push(item)
  })
  
  // Sort items within each category
  Object.keys(categorized).forEach(category => {
    categorized[category].sort((a, b) => a.ingredient.localeCompare(b.ingredient))
  })
  
  return categorized
}

function parseQuantity(quantityStr: string): number {
  // Handle fractions like 1/2, 3/4, etc.
  if (quantityStr.includes('/')) {
    const [numerator, denominator] = quantityStr.split('/')
    return parseInt(numerator) / parseInt(denominator)
  }
  
  // Handle mixed numbers like 1-1/2
  if (quantityStr.includes('-') && quantityStr.includes('/')) {
    const [whole, fraction] = quantityStr.split('-')
    const [numerator, denominator] = fraction.split('/')
    return parseInt(whole) + (parseInt(numerator) / parseInt(denominator))
  }
  
  return parseFloat(quantityStr) || 0
}

function formatQuantity(quantity: number): string {
  // Round to 2 decimal places and remove trailing zeros
  const rounded = Math.round(quantity * 100) / 100
  return rounded % 1 === 0 ? rounded.toString() : rounded.toString()
}