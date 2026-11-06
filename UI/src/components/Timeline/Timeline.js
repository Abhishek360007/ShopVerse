import React from 'react'

const steps = ['Order placed', 'In progress', 'Shipped', 'Delivered'];

const Timeline = ({ stepCount = 1 }) => (
  <ol className="my-4 grid grid-cols-4 gap-2" aria-label="Order progress">
    {steps.map((label, index) => {
      const done = index < stepCount;
      return (
        <li key={label} className="flex flex-col gap-2">
          <span className={`h-1.5 rounded-full ${done ? 'bg-gradient-to-r from-brand-purple to-brand-pink' : 'bg-fg/10'}`} />
          <span className={`text-xs font-semibold ${done ? 'text-fg' : 'text-muted'}`}>{label}</span>
        </li>
      );
    })}
  </ol>
)

export default Timeline
