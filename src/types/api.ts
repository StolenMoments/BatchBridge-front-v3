export type BatchStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

export interface Attachment {
  fileName: string
  fileContent: string
}

export interface AttachmentDetail extends Attachment {
  id?: number
}

export interface Prompt {
  id: number
  label: string
  systemPrompt?: string
  userPrompt: string
  attachments?: AttachmentDetail[]
  status: BatchStatus | 'PENDING'
  responseContent?: string
  errorMessage?: string
}

export interface Batch {
  id: number
  label: string
  model: string
  status: BatchStatus
  promptCount: number
  createdAt: string
  submittedAt?: string
  completedAt?: string
  externalBatchId?: string
  errorMessage?: string
  prompts?: Prompt[]
}

export interface BatchListItem {
  id: number
  label: string
  model: string
  status: BatchStatus
  promptCount: number
  createdAt: string
  submittedAt?: string
  completedAt?: string
}

export interface Model {
  id: string
  displayName: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
  }
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface SyncPromptsResponse {
  id: number
  resynced: number
  stillFailed: number
}
