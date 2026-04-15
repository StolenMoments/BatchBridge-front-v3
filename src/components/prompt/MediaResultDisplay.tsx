import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Prompt } from '@/types/api'

import { cn } from '@/lib/utils'

interface MediaResultDisplayProps {
  prompt: Prompt
  className?: string
  imageClassName?: string
  videoClassName?: string
  nullDisplay?: 'preparing' | 'empty'
}

export function MediaResultDisplay({
  prompt,
  className,
  imageClassName,
  videoClassName,
  nullDisplay = 'preparing',
}: MediaResultDisplayProps) {
  const { t } = useTranslation('prompt')
  const { promptType, resultMediaUrl, label } = prompt

  if (!promptType || promptType === 'TEXT') return null

  const isImage = promptType.startsWith('IMAGE')
  const isVideo = promptType.startsWith('VIDEO')

  if (!isImage && !isVideo) return null

  if (!resultMediaUrl) {
    const message =
      nullDisplay === 'empty' ? t('detail.noResponseContent') : t('detail.mediaPreparing')
    return (
      <div className={cn('flex items-center justify-center py-4', className)}>
        <p className="text-sm text-muted-foreground italic">{message}</p>
      </div>
    )
  }

  return (
    <div className={cn('flex w-full items-center justify-center', className)}>
      {isImage ? (
        <img
          src={resultMediaUrl}
          alt={label || 'AI generated image'}
          className={cn('rounded-md shadow-sm', imageClassName)}
        />
      ) : (
        <video controls src={resultMediaUrl} className={cn('rounded-md shadow-sm', videoClassName)}>
          <track kind="captions" />
        </video>
      )}
    </div>
  )
}
