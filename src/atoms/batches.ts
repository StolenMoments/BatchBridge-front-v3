import { atom } from 'jotai'

import type { BatchListItem, PaginatedResponse } from '../types/api'

export const batchesAtom = atom<PaginatedResponse<BatchListItem> | null>(null)
export const batchesParamsAtom = atom<{ status?: string; page: number; size: number }>({
  page: 1,
  size: 6,
})
