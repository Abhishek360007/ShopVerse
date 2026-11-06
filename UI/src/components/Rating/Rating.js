import React from 'react'
import { StarIcon } from '../common/Icons'

const Rating = ({rating}) => {
  const value = Number(rating) || 0;
  const full = Math.round(value);
  return (
    <div className="flex items-center gap-1" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} filled={n <= full} className={`h-4 w-4 ${n <= full ? 'text-amber-400' : 'text-fg/25'}`} />
      ))}
      <span className="ml-1 text-sm text-muted">{value.toFixed(1)}</span>
    </div>
  )
}

export default Rating
