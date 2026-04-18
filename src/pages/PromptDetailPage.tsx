import { format } from 'date-fns'
import {
  AlertTriangle,
  Bot,
  Edit,
  FileText,
  Layers3,
  Layout,
  Loader2,
  MessageSquare,
  Paperclip,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { useNavigate, useParams } from 'react-router-dom'

import type { BatchStatus, Prompt } from '@/types/api'

import { ErrorAlert } from '@/components/feedback/ErrorAlert'
import { MetaStrip } from '@/components/layout/MetaStrip'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/layout/StatusBadge'
import { ExternalContextChipsDisplay } from '@/components/prompt/ExternalContextChipsDisplay'
import { MediaResultDisplay } from '@/components/prompt/MediaResultDisplay'
import { PromptAttachmentsField } from '@/components/prompt/PromptAttachmentsField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePromptTypeLabels } from '@/hooks/usePromptType'
import { getApiErrorMessage, showApiErrorAlert } from '@/lib/api-error'
import { isDraftBatchEditable } from '@/lib/prompt-editability'
import { batchService } from '@/services/api'
import { isMediaPromptType } from '@/types/api'

export function PromptDetailPage() {
  const { t } = useTranslation(['prompt', 'common', 'batch'])
  const { batchId, promptId } = useParams<{ batchId: string; promptId: string }>()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null)
  const [batchLabel, setBatchLabel] = useState<string | null>(null)
  const [batchCreatedAt, setBatchCreatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'markdown' | 'text'>('text')

  const promptTypeLabels = usePromptTypeLabels()

  const statusLabelMap: Record<Prompt['status'], string> = {
    DRAFT: t('status.draft', { ns: 'common' }),
    IN_PROGRESS: t('status.inProgress', { ns: 'common' }),
    COMPLETED: t('status.completed', { ns: 'common' }),
    FAILED: t('status.failed', { ns: 'common' }),
    PENDING: t('status.pending', { ns: 'common' }),
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!batchId || !promptId) return

      setLoading(true)
      try {
        const [promptResponse, batchResponse] = await Promise.all([
          batchService.getPrompt(Number.parseInt(batchId, 10), Number.parseInt(promptId, 10)),
          batchService.getBatch(Number.parseInt(batchId, 10)),
        ])

        if (promptResponse.success) {
          setPrompt(promptResponse.data)
          setErrorMessage(null)
        }

        if (batchResponse.success) {
          setBatchStatus(batchResponse.data.status)
          setBatchLabel(batchResponse.data.label)
          setBatchCreatedAt(batchResponse.data.createdAt)
        }
      } catch (error) {
        console.error('Failed to fetch prompt details:', error)
        setErrorMessage(getApiErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [batchId, promptId])

  const handleDelete = async () => {
    if (!batchId || !promptId) return

    setIsDeleting(true)
    try {
      await batchService.deletePrompt(Number.parseInt(batchId, 10), Number.parseInt(promptId, 10))
      setErrorMessage(null)
      navigate(`/batches/${batchId}`)
    } catch (error) {
      console.error('Failed to delete prompt:', error)
      showApiErrorAlert(error)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (loading && !prompt) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!prompt) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">{t('detail.notFound', { ns: 'prompt' })}</p>
        <Button variant="link" onClick={() => navigate(`/batches/${batchId}`)}>
          {t('detail.backToBatch', { ns: 'prompt' })}
        </Button>
      </div>
    )
  }

  const isDraftEditable = isDraftBatchEditable(batchStatus)
  const isCompleted = prompt.status === 'COMPLETED'

  const modelAnswerSection = (
    <section key="model-answer" className="space-y-3">
      <div className="flex items-center gap-2">
        <Bot
          className={`h-5 w-5 ${prompt.status === 'FAILED' ? 'text-destructive' : 'text-primary'}`}
        />
        <h2 className="text-base font-semibold">{t('detail.modelAnswer', { ns: 'prompt' })}</h2>
      </div>

      {prompt.status === 'COMPLETED' ? (
        isMediaPromptType(prompt.promptType) ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-md border bg-background p-6 shadow-sm">
            <MediaResultDisplay
              prompt={prompt}
              imageClassName="max-h-[600px]"
              videoClassName="max-h-[600px] w-full"
              nullDisplay="empty"
            />
          </div>
        ) : (
          <div className="grid min-h-[200px] min-w-0 overflow-hidden rounded-md border bg-background shadow-sm">
            <TabsContent value="markdown" className="col-start-1 row-start-1 mt-0 min-w-0">
              <div className="prose prose-sm dark:prose-invert h-full max-w-none p-6 break-words">
                <ReactMarkdown>{prompt.responseContent || ''}</ReactMarkdown>
              </div>
            </TabsContent>
            <TabsContent value="text" className="col-start-1 row-start-1 mt-0 min-w-0">
              <div className="h-full p-6 font-mono text-sm break-words whitespace-pre-wrap">
                {prompt.responseContent || t('detail.noResponseContent', { ns: 'prompt' })}
              </div>
            </TabsContent>
          </div>
        )
      ) : prompt.status === 'FAILED' ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive shadow-sm">
          <div className="mb-2 flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4" />
            {t('detail.errorLabel', { ns: 'batch' })}
          </div>
          <div className="whitespace-pre-wrap opacity-90">
            {prompt.errorMessage || t('detail.unknownError', { ns: 'batch' })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t('detail.failedHelper', { ns: 'prompt' })}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-md border bg-muted/30 py-10 text-muted-foreground">
          <Loader2 className="mb-2 h-10 w-10 animate-spin opacity-20" />
          <p>
            {t('detail.waitingResponse', {
              ns: 'prompt',
              status: statusLabelMap[prompt.status],
            })}
          </p>
        </div>
      )}
    </section>
  )

  const userPromptSection = (
    <section key="user-prompt" className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">{t('detail.userPrompt', { ns: 'prompt' })}</h2>
      </div>
      <div className="grid min-h-[200px] min-w-0 overflow-hidden rounded-md border bg-muted/50">
        <TabsContent value="markdown" className="col-start-1 row-start-1 mt-0 min-w-0">
          <div className="prose prose-sm dark:prose-invert h-full max-w-none p-6 break-words">
            <ReactMarkdown>{prompt.userPrompt}</ReactMarkdown>
          </div>
        </TabsContent>
        <TabsContent value="text" className="col-start-1 row-start-1 mt-0 min-w-0">
          <div className="h-full p-6 font-mono text-sm break-words whitespace-pre-wrap">
            {prompt.userPrompt}
          </div>
        </TabsContent>
      </div>
    </section>
  )

  const attachmentsSection =
    !prompt.promptType || prompt.promptType === 'TEXT' ? (
      <section key="attachments" className="space-y-3">
        <div className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">
            {t('detail.attachments', { ns: 'prompt' })}
            {prompt.attachments?.length ? ` (${prompt.attachments.length})` : ''}
          </h2>
        </div>
        <div className="space-y-4">
          <ExternalContextChipsDisplay attachments={prompt.attachments ?? []} disabled />
          <PromptAttachmentsField
            attachments={prompt.attachments ?? []}
            disabled
            helperText={t('detail.attachmentsHelper', { ns: 'prompt' })}
            onChange={() => undefined}
          />
        </div>
      </section>
    ) : null

  const contentSections = isCompleted
    ? [modelAnswerSection, userPromptSection, attachmentsSection]
    : [userPromptSection, modelAnswerSection, attachmentsSection]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      <PageHeader
        onBack={() => navigate(`/batches/${batchId}`)}
        title={prompt.label}
        meta={
          <>
            <StatusBadge status={prompt.status} size="sm" />
            {prompt.promptType && prompt.promptType !== 'TEXT' ? (
              <Badge variant="secondary" className="h-6 px-2 py-0.5 text-[10px] font-medium">
                {promptTypeLabels[prompt.promptType]}
              </Badge>
            ) : null}
          </>
        }
      >
        {batchLabel ? (
          <MetaStrip
            items={[
              {
                icon: Layers3,
                label: t('edit.metaBatchLabel', { ns: 'prompt' }),
                value: (
                  <button
                    type="button"
                    className="underline-offset-2 hover:underline"
                    onClick={() => navigate(`/batches/${batchId}`)}
                  >
                    {batchLabel}
                  </button>
                ),
              },
            ]}
          />
        ) : null}
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        {/* Content Viewer — xl에서 왼쪽 컬럼 */}
        <Tabs
          value={viewMode}
          onValueChange={v => setViewMode(v as 'markdown' | 'text')}
          className="flex w-full flex-col gap-8 xl:col-start-1 xl:row-start-1"
        >
          {/* 공유 Segmented Control */}
          <div className="flex items-center justify-end">
            <TabsList variant="line" className="h-8">
              <TabsTrigger value="markdown" className="gap-1 px-3 py-1 text-xs">
                <Layout className="h-3 w-3" />
                {t('detail.markdown', { ns: 'prompt' })}
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-1 px-3 py-1 text-xs">
                <FileText className="h-3 w-3" />
                {t('detail.text', { ns: 'prompt' })}
              </TabsTrigger>
            </TabsList>
          </div>

          {contentSections}
        </Tabs>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:col-start-2 xl:row-start-1 xl:self-start">
          <Card className="border-border/70 bg-muted/10 shadow-none">
            <CardContent className="space-y-3 pt-5">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t('detail.sidebarStatus', { ns: 'prompt' })}
                </span>
                <StatusBadge status={prompt.status} size="sm" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t('detail.sidebarBatchStatus', { ns: 'prompt' })}
                </span>
                <StatusBadge status={batchStatus ?? 'DRAFT'} size="sm" />
              </div>

              {/* Non-text prompt type */}
              {prompt.promptType && prompt.promptType !== 'TEXT' ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {t('detail.sidebarType', { ns: 'prompt' })}
                  </span>
                  <Badge variant="secondary" className="h-6 px-2 py-0.5 text-[10px] font-medium">
                    {promptTypeLabels[prompt.promptType]}
                  </Badge>
                </div>
              ) : null}

              {/* Attachment count for text prompts */}
              {!prompt.promptType || prompt.promptType === 'TEXT' ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {t('detail.sidebarAttachments', { ns: 'prompt' })}
                  </span>
                  <span className="text-sm">{prompt.attachments?.length ?? 0}</span>
                </div>
              ) : null}

              {/* Batch link */}
              {batchLabel ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="shrink-0 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {t('detail.sidebarBatch', { ns: 'prompt' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/batches/${batchId}`)}
                    className="truncate text-right text-sm text-primary underline-offset-2 hover:underline"
                  >
                    {batchLabel}
                  </button>
                </div>
              ) : null}

              {/* Batch created date */}
              {batchCreatedAt ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {t('detail.sidebarCreatedAt', { ns: 'prompt' })}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(batchCreatedAt), 'yyyy-MM-dd')}
                  </span>
                </div>
              ) : null}

              {isDraftEditable ? (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {t('detail.draftEditableHint', { ns: 'prompt' })}
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => navigate(`/batches/${batchId}/prompts/${promptId}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                        {t('actions.edit', { ns: 'common' })}
                      </Button>

                      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('actions.delete', { ns: 'common' })}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t('detail.deleteTitle', { ns: 'prompt' })}</DialogTitle>
                          </DialogHeader>
                          <div className="py-4 text-muted-foreground">
                            {t('detail.deleteDescription', { ns: 'prompt' })}
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setIsDeleteDialogOpen(false)}
                              disabled={isDeleting}
                            >
                              {t('actions.cancel', { ns: 'common' })}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleDelete}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              {t('actions.delete', { ns: 'common' })}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
