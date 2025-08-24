import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const Component = onClick ? motion.div : 'div'
  
  return (
    <Component
      onClick={onClick}
      className={`
        bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden
        ${hover ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...(onClick && {
        whileHover: { y: -2, shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
        whileTap: { scale: 0.98 }
      })}
    >
      {children}
    </Component>
  )
}