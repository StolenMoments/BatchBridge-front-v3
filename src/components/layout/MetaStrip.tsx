import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface MetaItem {
  icon: LucideIcon
  label?: string
  value: ReactNode
}

interface MetaStripProps {
  items: MetaItem[]
  className?: string
}

export function MetaStrip({ items, className }: MetaStripProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground',
        className
      )}
    >
      {items.map((item, index) => {
        const Icon = item.icon
        return (
          <div key={index} className="flex items-center gap-1">
            <Icon className="h-4 w-4 shrink-0" />
            {item.label ? <span className="text-muted-foreground/70">{item.label}:</span> : null}
            <span>{item.value}</span>
          </div>
        )
      })}
    </div>
  )
}
