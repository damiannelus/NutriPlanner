# Nutrition Navigator

A comprehensive full-stack meal planning application built with React, TypeScript, and Firebase. Plan your weekly meals, manage recipes, and generate smart shopping lists.

## Features

### 🍳 Recipe Management
- **Create & Edit Recipes**: Add detailed recipes with ingredients, directions, nutrition facts, and tags
- **Smart Search & Filtering**: Filter by prep time, calories, servings, tags, and favorites
- **Nutrition Tracking**: Track calories, protein, carbs, and fat for each recipe
- **Favorites System**: Mark recipes as favorites for quick access
- **Tagging System**: Organize recipes with custom tags

### 📅 Meal Planning
- **Flexible Planning**: Plan meals for 2-7 days at a time
- **Smart Generation**: Auto-generate meal plans based on your calorie goals, meal preferences, and default recipes
- **Default Recipe Integration**: Uses your selected default recipes when generating meal plans or filling empty slots
- **Fill Empty Slots**: Intelligently fill only the empty meal slots while preserving existing meals
- **Visual Calendar**: Interactive calendar view with drag-and-drop functionality
- **Nutrition Overview**: See daily calorie totals and macro breakdowns
- **Meal Customization**: Adjust serving sizes and replace individual meals

### 🛒 Shopping Lists
- **Auto-Generated Lists**: Create shopping lists from your meal plans
- **Smart Categorization**: Ingredients organized by grocery store sections
- **Flexible Date Selection**: Generate lists for any 2-7 day period
- **Interactive Checkboxes**: Check off items as you shop
- **Copy to Clipboard**: Export your shopping list to share or print

### 👤 User Profiles
- **Personal Settings**: Set daily calorie goals and preferred meals per day
- **Default Recipes**: Set default recipes for each meal type (breakfast, brunch, lunch, dinner, snack)
- **Display Days Configuration**: Choose to display 2-7 days in meal planning and shopping lists
- **Sample Data**: Quick start with pre-loaded sample recipes
- **Secure Authentication**: Firebase-powered user authentication

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **Build Tool**: Vite
- **UI Components**: Custom components with Framer Motion animations
- **Form Handling**: React Hook Form
- **Date Management**: date-fns
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- **Node.js 18+** and npm ([Download](https://nodejs.org/))
- **Firebase Account** (free tier is sufficient)

### Quick Start (5 minutes)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Firebase project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Add project" and follow the wizard
   - Once created, click "Web" (</>) to add a web app
   - Copy the configuration values

3. **Enable Firebase services**
   - **Authentication**: Go to Build > Authentication > Get Started > Enable "Email/Password"
   - **Firestore**: Go to Build > Firestore Database > Create Database > Start in test mode

4. **Create environment file**
   
   Copy the example file and fill in your Firebase values:
   
   ```bash
   # Copy the template
   cp .env.example .env
   
   # Then edit .env with your Firebase config values
   ```
   
   **Windows PowerShell**:
   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```
   
   Your `.env` file should look like:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyC...
   VITE_FIREBASE_AUTH_DOMAIN=myproject.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=myproject-12345
   VITE_FIREBASE_STORAGE_BUCKET=myproject.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

5. **Start the app**
   ```bash
   npm run dev
   ```
   
   The app will open at `http://localhost:5173`

6. **First time setup**
   - Sign up for a new account
   - Complete your profile settings
   - Click "Add Sample Recipes" to get started quickly
   - Go to Meal Planning and generate your first plan!

### Troubleshooting

**App won't start or shows Firebase errors:**
- Verify all environment variables in `.env` are correctly set (no quotes, no spaces)
- Ensure Firebase Authentication and Firestore are enabled in your Firebase project
- Check the browser console for specific error messages

**Port 5173 already in use:**
```bash
# Vite will automatically use the next available port (5174, 5175, etc.)
```

**Permission errors on Windows:**
```powershell
# Run PowerShell as Administrator, then:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Firebase Setup

### Firestore Collections

The app uses these Firestore collections:

#### `profiles`
```javascript
{
  id: string,              // User ID
  email: string,           // User email
  full_name: string,       // Display name
  daily_calorie_goal: number, // Target daily calories
  meals_per_day: number,   // 3, 4, or 5 meals per day
  display_days: number,    // 2-7 days to display in planning/shopping
  default_recipes: {       // Default recipes for each meal type
    breakfast?: string,    // Recipe ID for default breakfast
    brunch?: string,       // Recipe ID for default brunch  
    lunch?: string,        // Recipe ID for default lunch
    dinner?: string,       // Recipe ID for default dinner
    snack?: string         // Recipe ID for default snack
  },
  created_at: timestamp,
  updated_at: timestamp
}
```

#### `recipes`
```javascript
{
  id: string,              // Auto-generated
  user_id: string,         // Owner's user ID
  name: string,            // Recipe name
  description: string,     // Recipe description
  prep_time: number,       // Prep time in minutes
  cook_time: number,       // Cook time in minutes
  total_time: number,      // Total time in minutes
  servings: number,        // Number of servings
  ingredients: [{          // Array of ingredients
    ingredient: string,    // Ingredient name
    size: string          // Amount (e.g., "2 cups")
  }],
  directions: [{           // Array of cooking steps
    step_description: string
  }],
  nutrition_facts: {       // Nutrition per serving
    calories: string,
    protein: string,
    carbs: string,
    fat: string
  },
  tags: string[],          // Recipe tags
  is_favorite: boolean,    // Favorite status
  created_at: timestamp,
  updated_at: timestamp
}
```

#### `daily_meal_plans`
```javascript
{
  id: string,              // Format: "${user_id}_${date}"
  user_id: string,         // Owner's user ID
  date: string,            // Date in YYYY-MM-DD format
  meals: {                 // Meals for this day
    breakfast?: {
      recipe: Recipe,      // Full recipe object
      servings: number     // Number of servings
    },
    second_breakfast?: { ... },
    lunch?: { ... },
    dinner?: { ... },
    snack?: { ... }
  },
  created_at: timestamp,
  updated_at: timestamp
}
```

### Security Rules

Add these Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /recipes/{recipeId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.user_id;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.user_id;
    }
    
    match /daily_meal_plans/{planId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.user_id;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.user_id;
    }
  }
}
```

## Usage Guide

### Getting Started
1. **Sign up** for a new account or sign in
2. **Set up your profile** with calorie goals and meal preferences
3. **Configure default recipes** (optional) for consistent meal planning
3. **Add sample recipes** using the "Add Sample Recipes" button in Profile settings
4. **Generate your first meal plan** in the Meal Planning tab

### Managing Recipes
- **Add Recipe**: Click "Add Recipe" and fill in the details
- **Edit Recipe**: Click the edit icon on any recipe card
- **Search**: Use the search bar to find recipes by name or description
- **Filter**: Use filters for prep time, calories, servings, and tags
- **Favorites**: Click the heart icon to mark recipes as favorites

### Meal Planning
- **Select Days**: Choose how many days to display (2-7 days)
- **Generate Plan**: Click "Generate Meal Plan" for automatic planning using your default recipes and preferences
- **Fill Empty Slots**: Use "Fill Empty Slots" to add meals only to empty slots while keeping existing meals
- **Replace Meals**: Click on any meal slot to replace it with a different recipe
- **Clear Plan**: Use "Empty the plan" to clear all meals for the displayed period
- **Navigate**: Use arrow buttons to move between different time periods

### Shopping Lists
- **Select Period**: Choose which days to include in your shopping list
- **View by Category**: Items are automatically organized by grocery store sections
- **Check Off Items**: Click checkboxes to mark items as purchased
- **Copy List**: Use "Copy List" to export your shopping list

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components (Navigation)
│   ├── meal-planning/  # Meal planning specific components
│   ├── recipes/        # Recipe management components
│   ├── shopping/       # Shopping list components
│   └── ui/            # Basic UI components (Button, Input, etc.)
├── contexts/           # React contexts (Auth)
├── hooks/             # Custom React hooks
├── lib/               # External service configurations
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── views/             # Main application views
└── data/              # Sample data and constants
```

### Key Features Implementation

#### Meal Plan Generation
The app uses a smart algorithm to generate balanced meal plans with default recipe integration:
- **Default Recipe Priority**: Uses your selected default recipes when available for each meal type
- Filters recipes by meal type (breakfast, lunch, dinner, etc.)
- Calculates appropriate serving sizes based on calorie goals
- Avoids repeating recipes within the same day
- Balances total daily calories within 90-105% of target
- Falls back to intelligent recipe selection for meals without default recipes set

#### Shopping List Categorization
Ingredients are automatically categorized using keyword matching:
- Fruits & Vegetables, Dairy & Eggs, Meat & Deli
- Frozen Foods, Pantry Items, Snacks & Sweets
- And many more categories for efficient shopping

#### Real-time Data Sync
All data is synchronized in real-time using Firebase:
- Changes appear instantly across all devices
- Offline support with automatic sync when reconnected
- Optimistic updates for smooth user experience

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:
1. Check the Firebase console for any configuration issues
2. Ensure all environment variables are properly set
3. Check the browser console for error messages
4. Verify that Firestore security rules are correctly configured

## Roadmap

- [x] Default recipe system for consistent meal planning
- [x] Flexible display days configuration (2-7 days)
- [x] Fill empty slots functionality
- [ ] Mobile app version
- [ ] Recipe import from URLs
- [ ] Meal plan sharing between users
- [ ] Advanced nutrition tracking
- [ ] Integration with grocery delivery services
- [ ] Recipe scaling and unit conversion
- [ ] Meal prep scheduling and reminders