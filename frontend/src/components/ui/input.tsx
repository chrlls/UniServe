import * as React from 'react'

import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base layout
          'flex h-11 w-full rounded-xl px-3.5 py-2 text-sm',
          // Colours — filled surface, no border at rest
          'bg-muted/60 text-foreground',
          'border border-transparent',
          'placeholder:text-muted-foreground/60',
          // Transition
          'transition-[border-color,box-shadow,background-color] duration-150 ease-out',
          // Focus — blue ring + subtle bright surface
          'focus-visible:outline-none',
          'focus-visible:bg-background',
          'focus-visible:border-ring',
          'focus-visible:ring-[3px] focus-visible:ring-ring/20',
          // Disabled
          'disabled:cursor-not-allowed disabled:opacity-50',
          // File input
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
