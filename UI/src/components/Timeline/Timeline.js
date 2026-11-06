import React from 'react'
import { ORDER_STEPS } from '../../utils/order-util'

/** Compact progress bar for order lists: one segment per delivery step. */
const Timeline = ({ stepCount = 1 }) => (
  <ol className="my-3 grid grid-cols-6 gap-1.5" aria-label={`Step ${stepCount} of ${ORDER_STEPS.length}`}>
    {ORDER_STEPS.map(({ label }, index) => {
      const done = index < stepCount;
      return (
        <li key={label} className="flex flex-col gap-1.5">
          <span className={`h-1.5 rounded-full ${done ? 'bg-gradient-to-r from-brand-purple to-brand-pink' : 'bg-fg/10'}`} />
          <span className={`hidden text-[11px] font-semibold sm:block ${done ? 'text-fg' : 'text-muted'}`}>{label}</span>
        </li>
      );
    })}
  </ol>
)

export default Timeline
