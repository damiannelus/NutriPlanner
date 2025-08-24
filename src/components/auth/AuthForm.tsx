import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'

interface AuthFormData {
  email: string
  password: string
  fullName?: string
}

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn, signUp, isConfigured } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormData>()

  // Show configuration message if Firebase is not set up
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Firebase Configuration Required</h2>
            <p className="text-gray-600 mb-6">
              Please configure your Firebase environment variables in the .env file to use the application.
            </p>
            <div className="text-left bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">Required variables:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• VITE_FIREBASE_API_KEY</li>
                <li>• VITE_FIREBASE_AUTH_DOMAIN</li>
                <li>• VITE_FIREBASE_PROJECT_ID</li>
                <li>• VITE_FIREBASE_STORAGE_BUCKET</li>
                <li>• VITE_FIREBASE_MESSAGING_SENDER_ID</li>
                <li>• VITE_FIREBASE_APP_ID</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: AuthFormData) => {
    try {
      setLoading(true)
      setError('')

      if (isLogin) {
        await signIn(data.email, data.password)
      } else {
        await signUp(data.email, data.password, data.fullName || '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <User className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900">Nutrition Navigator</h2>
            <p className="text-gray-600 mt-2">
              {isLogin ? 'Welcome back!' : 'Start your meal planning journey'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {!isLogin && (
              <div>
                <Input
                  label="Full Name"
                  {...register('fullName', { required: !isLogin })}
                  error={errors.fullName?.message}
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <Input
                label="Email"
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address'
                  }
                })}
                error={errors.email?.message}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  error={errors.password?.message}
                  placeholder="Enter your password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center mt-6"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={loading}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}