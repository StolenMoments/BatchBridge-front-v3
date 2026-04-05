import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import type { Attachment, BatchStatus, Prompt } from '@/types/api'

import { ErrorAlert } from '@/components/feedback/ErrorAlert'
import { ExternalContextChipsDisplay } from '@/components/prompt/ExternalContextChipsDisplay'
import { ExternalContextImportSection } from '@/components/prompt/ExternalContextImportSection'
import { PromptAttachmentsField } from '@/components/prompt/PromptAttachmentsField'
import { PromptTemplateSelect } from '@/components/prompt/PromptTemplateSelect'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getApiErrorMessage, showApiErrorAlert } from '@/lib/api-error'
import { batchService } from '@/services/api'

export function PromptEditPage() {
  const { t } = useTranslation(['prompt', 'common', 'batch'])
  const { batchId, promptId } = useParams<{ batchId: string; promptId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null)

  const [editLabel, setEditLabel] = useState('')
  const [editSystemPrompt, setEditSystemPrompt] = useState('')
  const [editUserPrompt, setEditUserPrompt] = useState('')
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [isAttachmentPending, setIsAttachmentPending] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!batchId || !promptId) return

      setLoading(true)
      try {
        const batchIdNum = Number.parseInt(batchId, 10)
        const promptIdNum = Number.parseInt(promptId, 10)

        const [promptResponse, batchResponse] = await Promise.all([
          batchService.getPrompt(batchIdNum, promptIdNum),
          batchService.getBatch(batchIdNum),
        ])

        if (promptResponse.success) {
          const p = promptResponse.data
          setPrompt(p)
          setEditLabel(p.label || '')
          setEditSystemPrompt(p.systemPrompt || '')
          setEditUserPrompt(p.userPrompt || '')
          setEditAttachments(p.attachments ?? [])
        }

        if (batchResponse.success) {
          setBatchStatus(batchResponse.data.status)
        }
      } catch (error) {
        console.error('Failed to fetch data for edit:', error)
        setErrorMessage(getApiErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [batchId, promptId])

  const haveAttachmentsChanged = (current: Attachment[], next: Attachment[]) => {
    if (current.length !== next.length) return true
    return current.some((attachment, index) => {
      const nextAttachment = next[index]
      return (
        attachment.fileName !== nextAttachment?.fileName ||
        attachment.fileContent !== nextAttachment?.fileContent
      )
    })
  }

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!batchId || !promptId || !prompt || isAttachmentPending) return

    setIsUpdating(true)
    try {
      const batchIdNumber = Number.parseInt(batchId, 10)
      const promptIdNumber = Number.parseInt(promptId, 10)
      const attachmentsChanged = haveAttachmentsChanged(prompt.attachments ?? [], editAttachments)

      if (attachmentsChanged) {
        // If attachments changed, we must recreate the prompt (as per original logic in PromptDetailPage)
        const createResponse = await batchService.addPrompt(batchIdNumber, {
          label: editLabel || undefined,
          systemPrompt: editSystemPrompt || undefined,
          userPrompt: editUserPrompt,
          attachments: editAttachments,
        })

        if (createResponse.success) {
          await batchService.deletePrompt(batchIdNumber, promptIdNumber)
          navigate(`/batches/${batchId}/prompts/${createResponse.data.id}`, { replace: true })
        }
        return
      }

      const updateResponse = await batchService.updatePrompt(batchIdNumber, promptIdNumber, {
        label: editLabel,
        systemPrompt: editSystemPrompt,
        userPrompt: editUserPrompt,
        attachments: editAttachments,
      })

      if (updateResponse.success) {
        navigate(`/batches/${batchId}/prompts/${promptId}`, { replace: true })
      }
    } catch (error) {
      console.error('Failed to update prompt:', error)
      showApiErrorAlert(error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!prompt || batchStatus !== 'DRAFT' || prompt.status !== 'PENDING') {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">
          {!prompt ? t('detail.notFound') : t('edit.notAllowed')}
        </p>
        <Button variant="link" onClick={() => navigate(`/batches/${batchId}/prompts/${promptId}`)}>
          {t('edit.backToDetail')}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/batches/${batchId}/prompts/${promptId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('detail.editTitle')}</h1>
          <p className="text-muted-foreground">{t('detail.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleUpdate}>
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.editTitle')}</CardTitle>
            <CardDescription>{t('edit.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-label">{t('detail.label')}</Label>
              <Input
                id="edit-label"
                value={editLabel}
                onChange={event => setEditLabel(event.target.value)}
                placeholder={t('detail.labelPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-system">{t('detail.systemPrompt', { ns: 'batch' })}</Label>
              <Textarea
                id="edit-system"
                value={editSystemPrompt}
                onChange={event => setEditSystemPrompt(event.target.value)}
                placeholder={t('create.systemPromptPlaceholder', { ns: 'batch' })}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-user">{t('detail.userPrompt')}</Label>
              <PromptTemplateSelect onSelectTemplate={setEditUserPrompt} />
              <Textarea
                id="edit-user"
                value={editUserPrompt}
                onChange={event => setEditUserPrompt(event.target.value)}
                placeholder={t('detail.userPromptPlaceholder')}
                required
                className="min-h-[200px]"
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <Label className="text-base font-semibold">{t('detail.attachments')}</Label>
              <ExternalContextImportSection
                attachments={editAttachments}
                disabled={isUpdating || isAttachmentPending}
                promptId={promptId}
                onAttachmentsChange={setEditAttachments}
              />
              <ExternalContextChipsDisplay
                attachments={editAttachments}
                onRemove={fileName =>
                  setEditAttachments(prev => prev.filter(a => a.fileName !== fileName))
                }
              />
              <PromptAttachmentsField
                attachments={editAttachments}
                errorMessage={attachmentError}
                onChange={setEditAttachments}
                onErrorChange={setAttachmentError}
                onPendingChange={setIsAttachmentPending}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/batches/${batchId}/prompts/${promptId}`)}
              disabled={isUpdating || isAttachmentPending}
            >
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={isUpdating || isAttachmentPending || !editUserPrompt}>
              {isUpdating || isAttachmentPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t('actions.save', { ns: 'common' })}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
