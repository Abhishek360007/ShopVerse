import React from 'react'

const Spinner = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm" role="status">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-fg/15 border-t-brand-pink" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export default Spinner
