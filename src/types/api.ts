export type BatchStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

export type PromptType =
  | 'TEXT'
  | 'IMAGE_GENERATION'
  | 'IMAGE_EDIT'
  | 'VIDEO_GENERATION'
  | 'VIDEO_EDIT'

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
  promptType?: PromptType
  sourceMediaUrl?: string
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
  supportedPromptTypes?: PromptType[]
}

export interface ApiErrorPayload {
  code: string
  message: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: ApiErrorPayload
}

export type ContextPreviewSourceType = 'GITHUB_PR' | 'JIRA' | 'CONFLUENCE'

export type ContextPreviewSourceStatus = 'SUCCESS' | 'FAILED'

export interface ContextPreviewRequest {
  githubPrUrl?: string
  jiraKeys: string[]
  confluencePageIds: string[]
}

export interface ContextPreviewSource {
  type: ContextPreviewSourceType
  id: string
  title: string
  status: ContextPreviewSourceStatus
  error?: string
  formattedText?: string | null
}

export interface ContextPreviewResponse {
  sources: ContextPreviewSource[]
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

export interface PromptTemplate {
  id: number
  name: string
  description?: string
  systemPrompt?: string
  userPrompt: string
  createdAt: string
  updatedAt: string
}

export interface PromptTemplateRequest {
  name: string
  description?: string
  systemPrompt?: string
  userPrompt: string
}
