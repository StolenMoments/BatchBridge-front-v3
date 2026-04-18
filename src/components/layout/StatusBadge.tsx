import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { BatchStatus } from '@/types/api'

import { Badge } from '@/components/ui/badge'
import { statusAppearanceMap, statusBadgeToneClassMap, type StatusTone } from '@/lib/batch-status'
import { cn } from '@/lib/utils'

type PromptStatus = BatchStatus | 'PENDING'

const promptOnlyAppearance = {
  PENDING: { tone: 'warning' as StatusTone, icon: Clock },
}

const allAppearance: Record<PromptStatus, { tone: StatusTone; icon: React.ElementType }> = {
  ...statusAppearanceMap,
  ...promptOnlyAppearance,
}

interface StatusBadgeProps {
  status: PromptStatus
  size?: 'sm' | 'default'
  className?: string
}

export function StatusBadge({ status, size = 'default', className }: StatusBadgeProps) {
  const { t } = useTranslation('common')

  const labelMap: Record<PromptStatus, string> = {
    DRAFT: t('status.draft'),
    IN_PROGRESS: t('status.inProgress'),
    COMPLETED: t('status.completed'),
    FAILED: t('status.failed'),
    PENDING: t('status.pending'),
  }

  const appearance = allAppearance[status]
  const Icon = appearance.icon
  const isSpinning = status === 'IN_PROGRESS'

  const sizeClasses =
    size === 'sm'
      ? 'h-7 px-2.5 py-1 text-xs font-semibold tracking-[0.01em]'
      : 'h-8 px-3 py-1.5 text-sm font-medium'

  const iconSize = size === 'sm' ? 'mr-1.5 h-3.5 w-3.5' : 'mr-2 h-4 w-4'

  return (
    <Badge
      className={cn(
        'flex items-center border-transparent',
        statusBadgeToneClassMap[appearance.tone],
        sizeClasses,
        className
      )}
    >
      <Icon className={cn(iconSize, isSpinning && 'animate-spin')} />
      {labelMap[status]}
    </Badge>
  )
}
