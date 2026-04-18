import { CheckCircle2, FileText, Loader2, XCircle, type LucideIcon } from 'lucide-react'

import type { BatchStatus } from '@/types/api'

export type StatusTone = 'success' | 'danger' | 'warning' | 'progress' | 'neutral-status'

export const statusBadgeToneClassMap: Record<StatusTone, string> = {
  success: 'bg-success text-success-foreground',
  danger: 'bg-danger text-danger-foreground',
  warning: 'bg-warning text-warning-foreground',
  progress: 'bg-progress text-progress-foreground',
  'neutral-status': 'bg-neutral-status text-neutral-status-foreground',
}

export const statusAppearanceMap: Record<BatchStatus, { tone: StatusTone; icon: LucideIcon }> = {
  DRAFT: { tone: 'neutral-status', icon: FileText },
  IN_PROGRESS: { tone: 'progress', icon: Loader2 },
  COMPLETED: { tone: 'success', icon: CheckCircle2 },
  FAILED: { tone: 'danger', icon: XCircle },
}
