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
  children?: ReactNode
}

export function PageHeader({
  title,
  description,
  onBack,
  actions,
  meta,
  className,
  children,
}: PageHeaderProps) {
  const indented = !!onBack

  return (
    <div
      className={cn('flex flex-col justify-between gap-4 md:flex-row md:items-start', className)}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex min-w-0 flex-wrap items-start gap-2 sm:items-center">
          {onBack ? (
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : null}
          <h1 className="min-w-0 text-3xl font-bold tracking-tight break-words">{title}</h1>
          {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {description ? (
          <p className={cn('text-muted-foreground', indented && 'ml-11')}>{description}</p>
        ) : null}
        {children ? <div className={cn(indented && 'ml-11')}>{children}</div> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center justify-end gap-2 md:mt-1 md:w-auto md:shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
