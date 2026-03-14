import * as React from 'react'

import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-xl px-3.5 py-3 text-sm',
        'bg-muted/78 text-foreground shadow-sm',
        'border border-transparent',
        'placeholder:text-muted-foreground/60',
        'transition-[border-color,box-shadow,background-color] duration-150 ease-out',
        'focus-visible:outline-none',
        'focus-visible:bg-muted/90',
        'focus-visible:border-ring',
        'focus-visible:ring-[3px] focus-visible:ring-ring/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }

