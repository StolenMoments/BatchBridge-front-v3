import { CheckCircle2, FileText, Loader2, XCircle, type LucideIcon } from 'lucide-react'

import type { BatchStatus } from '@/types/api'

export const statusAppearanceMap: Record<
  BatchStatus,
  { color: string; gradient: string; icon: LucideIcon }
> = {
  DRAFT: { color: 'bg-slate-500', gradient: 'from-slate-500/10 to-transparent', icon: FileText },
  IN_PROGRESS: {
    color: 'bg-blue-500',
    gradient: 'from-blue-500/10 to-transparent',
    icon: Loader2,
  },
  COMPLETED: {
    color: 'bg-emerald-600',
    gradient: 'from-emerald-600/10 to-transparent',
    icon: CheckCircle2,
  },
  FAILED: { color: 'bg-red-500', gradient: 'from-red-500/10 to-transparent', icon: XCircle },
}
