import { ArrowRight, ExternalLink, Paperclip, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { Prompt } from '@/types/api'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePromptTypeLabels } from '@/hooks/usePromptType'

interface BatchDraftPromptRowProps {
  batchId: number
  prompt: Prompt
  index: number
  onDelete: (promptId: number) => void
}

export function BatchDraftPromptRow({
  batchId,
  prompt,
  index,
  onDelete,
}: BatchDraftPromptRowProps) {
  const { t } = useTranslation(['batch', 'common'])
  const promptTypeLabels = usePromptTypeLabels()

  const attachmentCount = prompt.attachments?.length ?? 0
  const preview = prompt.userPrompt.trim() || t('detail.noPreview', { ns: 'batch' })

  return (
    <div className="px-4 py-4 transition-colors hover:bg-muted/10">
      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1.5fr)_220px_auto] xl:items-start">
        <Link
          to={`/batches/${batchId}/prompts/${prompt.id}`}
          className="group min-w-0 rounded-xl px-3 py-2 transition-colors hover:bg-primary/5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[11px]">
              {t('detail.rowNumber', { ns: 'batch', index: index + 1 })}
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              {promptTypeLabels[prompt.promptType ?? 'TEXT']}
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              {attachmentCount > 0
                ? t('detail.attachmentStateAttached', { ns: 'batch' })
                : t('detail.attachmentStateNone', { ns: 'batch' })}
            </Badge>
          </div>

          <div className="mt-3 min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-base font-semibold text-foreground group-hover:text-primary">
                {prompt.label}
              </span>
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <p className="mt-2 line-clamp-2 text-sm whitespace-pre-wrap text-muted-foreground">
              {preview}
            </p>
          </div>
        </Link>

        <div className="rounded-xl bg-muted/15 px-3 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span>{t('detail.attachmentsLabel', { ns: 'batch' })}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {attachmentCount > 0
              ? t('detail.attachmentCount', { ns: 'batch', count: attachmentCount })
              : t('detail.attachmentEmpty', { ns: 'batch' })}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 xl:justify-end">
          <Link
            to={`/batches/${batchId}/prompts/${prompt.id}`}
            className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t('detail.openPrompt')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(prompt.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('actions.delete', { ns: 'common' })}
          </Button>
        </div>
      </div>
    </div>
  )
}
