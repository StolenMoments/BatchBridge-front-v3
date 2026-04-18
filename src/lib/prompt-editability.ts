import type { BatchStatus } from '@/types/api'

export function isDraftBatchEditable(batchStatus: BatchStatus | null): boolean {
  return batchStatus === 'DRAFT'
}
