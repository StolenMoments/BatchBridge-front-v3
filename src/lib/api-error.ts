import axios from 'axios'

import type { ApiResponse } from '@/types/api'

import i18n from '@/plugins/i18n'

const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR'
const NETWORK_ERROR_CODE = 'NETWORK_ERROR'

interface ParsedApiError {
  code: string
  message?: string
}

function normalizeErrorCode(errorCode?: string | null): string {
  return errorCode?.trim() || UNKNOWN_ERROR_CODE
}

export function translateApiErrorCode(errorCode?: string | null, fallbackMessage?: string): string {
  const normalizedErrorCode = normalizeErrorCode(errorCode)
  const translationKey = `error.${normalizedErrorCode}`

  if (i18n.exists(translationKey)) {
    return i18n.t(translationKey)
  }

  if (fallbackMessage) {
    return fallbackMessage
  }

  return i18n.t(`error.${UNKNOWN_ERROR_CODE}`)
}

export function parseApiError(error: unknown): ParsedApiError {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    if (!error.response) {
      return {
        code: error.code === 'ERR_NETWORK' ? NETWORK_ERROR_CODE : UNKNOWN_ERROR_CODE,
        message: error.message,
      }
    }

    return {
      code: normalizeErrorCode(error.response.data?.error?.code),
      message: error.response.data?.error?.message || error.message,
    }
  }

  if (error instanceof Error) {
    return {
      code: UNKNOWN_ERROR_CODE,
      message: error.message,
    }
  }

  return {
    code: UNKNOWN_ERROR_CODE,
  }
}

export function getApiErrorMessage(error: unknown): string {
  const parsedError = parseApiError(error)

  return translateApiErrorCode(parsedError.code, parsedError.message)
}

export function showApiErrorAlert(error: unknown): void {
  window.alert(getApiErrorMessage(error))
}
