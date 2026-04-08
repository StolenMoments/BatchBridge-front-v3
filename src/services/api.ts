import axios from 'axios'

import type {
  Attachment,
  ApiResponse,
  Batch,
  BatchListItem,
  ContextPreviewRequest,
  ContextPreviewResponse,
  Model,
  PaginatedResponse,
  Prompt,
  SyncPromptsResponse,
} from '../types/api'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export const batchService = {
  getBatches: async (
    params?: { status?: string; page?: number; size?: number },
    config?: { signal?: AbortSignal }
  ) => {
    const response = await api.get<ApiResponse<PaginatedResponse<BatchListItem>>>('/batches', {
      params,
      ...config,
    })
    return response.data
  },

  createBatch: async (data: {
    label?: string
    model: string
    prompt: {
      label?: string
      systemPrompt?: string
      userPrompt: string
      attachments?: Attachment[]
    }
  }) => {
    const response = await api.post<ApiResponse<Batch>>('/batches', data)
    return response.data
  },

  getBatch: async (id: number) => {
    const response = await api.get<ApiResponse<Batch>>(`/batches/${id}`)
    return response.data
  },

  submitBatch: async (id: number) => {
    const response = await api.post<ApiResponse<Batch>>(`/batches/${id}/submit`)
    return response.data
  },

  updateBatch: async (id: number, data: { label?: string; model?: string }) => {
    const response = await api.patch<ApiResponse<Batch>>(`/batches/${id}`, data)
    return response.data
  },

  deleteBatch: async (id: number): Promise<void> => {
    await api.delete(`/batches/${id}`)
  },

  syncBatch: async (id: number) => {
    const response = await api.post<ApiResponse<Batch>>(`/batches/${id}/sync`)
    return response.data
  },

  addPrompt: async (
    batchId: number,
    data: {
      label?: string
      systemPrompt?: string
      userPrompt: string
      attachments?: Attachment[]
    }
  ) => {
    const response = await api.post<ApiResponse<Prompt>>(`/batches/${batchId}/prompts`, data)
    return response.data
  },

  getPrompt: async (batchId: number, promptId: number) => {
    const response = await api.get<ApiResponse<Prompt>>(`/batches/${batchId}/prompts/${promptId}`)
    return response.data
  },

  updatePrompt: async (
    batchId: number,
    promptId: number,
    data: {
      label?: string
      systemPrompt?: string
      userPrompt: string
      attachments?: Attachment[]
    }
  ) => {
    const response = await api.put<ApiResponse<Prompt>>(
      `/batches/${batchId}/prompts/${promptId}`,
      data
    )
    return response.data
  },

  deletePrompt: async (batchId: number, promptId: number): Promise<void> => {
    await api.delete(`/batches/${batchId}/prompts/${promptId}`)
  },

  syncPrompts: async (id: number) => {
    const response = await api.post<ApiResponse<SyncPromptsResponse>>(`/batches/${id}/sync-prompts`)
    return response.data
  },
}

export const modelService = {
  getModels: async () => {
    const response = await api.get<ApiResponse<Model[]>>('/models')
    return response.data
  },
}

export const externalContextService = {
  preview: async (data: ContextPreviewRequest) => {
    const response = await api.post<ApiResponse<ContextPreviewResponse> | ContextPreviewResponse>(
      '/context/preview',
      data
    )

    if ('success' in response.data) {
      return response.data
    }

    return {
      success: true,
      data: response.data,
    }
  },
}
