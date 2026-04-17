import { ArrowLeft } from 'lucide-react'

import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  description?: string
  onBack?: () => void
  actions?: ReactNode
  meta?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  onBack,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn('flex flex-col justify-between gap-4 md:flex-row md:items-start', className)}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {onBack ? (
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : null}
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {meta ? <div className="flex items-center gap-2">{meta}</div> : null}
        </div>
        {description ? (
          <p className={cn('text-muted-foreground', onBack ? 'ml-11' : '')}>{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2 md:mt-1">{actions}</div> : null}
    </div>
  )
}
