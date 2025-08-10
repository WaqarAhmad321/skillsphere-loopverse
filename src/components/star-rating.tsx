"use client"

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  count?: number
  value?: number
  onChange?: (rating: number) => void
  size?: number
  isEditable?: boolean
}

export function StarRating({
  count = 5,
  value = 0,
  onChange,
  size = 24,
  isEditable = true,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined)

  const handleMouseMove = (index: number) => {
    if (!isEditable) return
    setHoverValue(index + 1)
  }

  const handleMouseLeave = () => {
    if (!isEditable) return
    setHoverValue(undefined)
  }

  const handleClick = (index: number) => {
    if (!isEditable || !onChange) return
    onChange(index + 1)
  }

  const stars = Array(count).fill(0)

  return (
    <div className="flex items-center" onMouseLeave={handleMouseLeave}>
      {stars.map((_, i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            'text-gray-300 transition-colors',
            (hoverValue || value) > i ? 'text-yellow-400' : 'text-gray-300',
            isEditable && 'cursor-pointer'
          )}
          onMouseMove={() => handleMouseMove(i)}
          onClick={() => handleClick(i)}
          fill={(hoverValue || value) > i ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  )
}
