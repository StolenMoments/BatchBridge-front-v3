import { ExternalLink, Eye, Paperclip, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { Prompt } from '@/types/api'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className="border-border/60 shadow-sm transition-colors hover:border-primary/40">
      <CardHeader className="gap-3 px-4 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
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

            <CardTitle className="min-w-0 text-base">
              <Link
                to={`/batches/${batchId}/prompts/${prompt.id}`}
                className="inline-flex max-w-full items-center gap-1 truncate text-primary hover:underline"
              >
                <span className="truncate">{prompt.label}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </Link>
            </CardTitle>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Link to={`/batches/${batchId}/prompts/${prompt.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                {t('detail.openPrompt', { ns: 'batch' })}
              </Button>
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
      </CardHeader>

      <CardContent className="grid gap-4 px-4 pt-0 pb-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0 rounded-xl border bg-muted/20 p-3">
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t('detail.previewLabel', { ns: 'batch' })}
          </p>
          <p className="line-clamp-3 text-sm whitespace-pre-wrap">{preview}</p>
        </div>

        <div className="rounded-xl border bg-muted/20 p-3">
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
      </CardContent>
    </Card>
  )
}
