import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface ToolbarProps {
  filters?: ReactNode
  controls?: ReactNode
  className?: string
}

export function Toolbar({ filters, controls, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      {filters ? <div>{filters}</div> : null}
      {controls ? <div className="flex items-center gap-2">{controls}</div> : null}
    </div>
  )
}
