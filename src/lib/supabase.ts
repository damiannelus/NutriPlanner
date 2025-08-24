import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          daily_calorie_goal: number
          meals_per_day: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          daily_calorie_goal?: number
          meals_per_day?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          daily_calorie_goal?: number
          meals_per_day?: number
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          prep_time: number | null
          cook_time: number | null
          servings: number | null
          ingredients: any[]
          directions: any[]
          nutrition_facts: any
          tags: string[]
          is_favorite: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description: string
          prep_time?: number | null
          cook_time?: number | null
          servings?: number | null
          ingredients: any[]
          directions: any[]
          nutrition_facts: any
          tags?: string[]
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          prep_time?: number | null
          cook_time?: number | null
          servings?: number | null
          ingredients?: any[]
          directions?: any[]
          nutrition_facts?: any
          tags?: string[]
          is_favorite?: boolean
          updated_at?: string
        }
      }
      meal_plans: {
        Row: {
          id: string
          user_id: string
          week_start: string
          meals: any[]
          shared_with: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          meals: any[]
          shared_with?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          meals?: any[]
          shared_with?: string[]
          updated_at?: string
        }
      }
    }
  }
}