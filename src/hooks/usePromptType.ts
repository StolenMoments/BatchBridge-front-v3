import { useTranslation } from 'react-i18next'

import type { Model, PromptType } from '@/types/api'

export const usePromptType = (promptType: PromptType = 'TEXT') => {
  return {
    isTextType: promptType === 'TEXT',
    isEditType: promptType === 'IMAGE_EDIT' || promptType === 'VIDEO_EDIT',
  }
}

export const useSupportedPromptTypes = (model: Model | undefined) => {
  const supportedTypes = model?.supportedPromptTypes ?? null
  const showTypeSelect =
    supportedTypes !== null && !(supportedTypes.length === 1 && supportedTypes[0] === 'TEXT')
  return { supportedTypes, showTypeSelect }
}

export const usePromptTypeLabels = () => {
  const { t } = useTranslation('batch')
  return {
    TEXT: t('common.promptTypes.TEXT'),
    IMAGE_GENERATION: t('common.promptTypes.IMAGE_GENERATION'),
    IMAGE_EDIT: t('common.promptTypes.IMAGE_EDIT'),
    VIDEO_GENERATION: t('common.promptTypes.VIDEO_GENERATION'),
    VIDEO_EDIT: t('common.promptTypes.VIDEO_EDIT'),
  } as Record<PromptType, string>
}
