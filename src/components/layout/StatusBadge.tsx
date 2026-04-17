import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { BatchStatus } from '@/types/api'

import { Badge } from '@/components/ui/badge'
import { statusAppearanceMap } from '@/lib/batch-status'

type PromptStatus = BatchStatus | 'PENDING'

const promptOnlyAppearance = {
  PENDING: { color: 'bg-amber-500', icon: Clock },
}

const allAppearance: Record<PromptStatus, { color: string; icon: React.ElementType }> = {
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
      ? 'h-6 px-2 py-0.5 text-[10px] font-medium'
      : 'h-8 px-3 py-1.5 text-sm font-medium'

  const iconSize = size === 'sm' ? 'mr-1.5 h-3 w-3' : 'mr-2 h-4 w-4'

  return (
    <Badge
      className={`${appearance.color} flex items-center text-white ${sizeClasses} ${className ?? ''}`}
    >
      <Icon className={`${iconSize} ${isSpinning ? 'animate-spin' : ''}`} />
      {labelMap[status]}
    </Badge>
  )
}
