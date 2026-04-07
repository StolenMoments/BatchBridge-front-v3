import { format } from 'date-fns'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Cpu,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import type { Attachment, Batch, BatchStatus } from '@/types/api'

import { ErrorAlert } from '@/components/feedback/ErrorAlert'
import { ExternalContextImportSection } from '@/components/prompt/ExternalContextImportSection'
import { PromptAttachmentsField } from '@/components/prompt/PromptAttachmentsField'
import { PromptTemplateSelect } from '@/components/prompt/PromptTemplateSelect'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
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

const statusAppearanceMap: Record<BatchStatus, { color: string; icon: LucideIcon }> = {
  DRAFT: { color: 'bg-slate-500', icon: FileText },
  IN_PROGRESS: { color: 'bg-blue-500', icon: Loader2 },
  COMPLETED: { color: 'bg-green-500', icon: CheckCircle2 },
  FAILED: { color: 'bg-red-500', icon: XCircle },
}

export function BatchDetailPage() {
  const { t } = useTranslation(['batch', 'common', 'external_context'])
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [batch, setBatch] = useState<Batch | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [resyncing, setResyncing] = useState(false)
  const [newPrompt, setNewPrompt] = useState({
    label: '',
    systemPrompt: '',
    userPrompt: '',
    attachments: [] as Attachment[],
  })
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [isAttachmentPending, setIsAttachmentPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [externalContextResetToken, setExternalContextResetToken] = useState(0)

  const batchStatusLabelMap: Record<BatchStatus, string> = {
    DRAFT: t('status.draft', { ns: 'common' }),
    IN_PROGRESS: t('status.inProgress', { ns: 'common' }),
    COMPLETED: t('status.completed', { ns: 'common' }),
    FAILED: t('status.failed', { ns: 'common' }),
  }

  const promptStatusLabelMap: Record<BatchStatus | 'PENDING', string> = {
    DRAFT: t('status.draft', { ns: 'common' }),
    IN_PROGRESS: t('status.inProgress', { ns: 'common' }),
    COMPLETED: t('status.completed', { ns: 'common' }),
    FAILED: t('status.failed', { ns: 'common' }),
    PENDING: t('status.pending', { ns: 'common' }),
  }

  const fetchBatch = useCallback(
    async (showLoading = true) => {
      if (!id) return
      if (showLoading) setLoading(true)

      try {
        const response = await batchService.getBatch(Number.parseInt(id, 10))
        if (response.success) {
          setBatch({ ...response.data })
          setErrorMessage(null)
        }
      } catch (error) {
        console.error('Failed to fetch batch:', error)
        setErrorMessage(getApiErrorMessage(error))
      } finally {
        if (showLoading) {
          setLoading(false)
        }
      }
    },
    [id]
  )

  useEffect(() => {
    void fetchBatch()
  }, [fetchBatch])

  const handleSubmitBatch = async () => {
    if (!batch) return

    setSubmitting(true)
    try {
      const response = await batchService.submitBatch(batch.id)
      if (response.success) {
        setErrorMessage(null)
        navigate('/batches')
      }
    } catch (error) {
      console.error('Failed to submit batch:', error)
      showApiErrorAlert(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSyncBatch = async () => {
    if (!batch) return

    setSyncing(true)
    try {
      const response = await batchService.syncBatch(batch.id)
      if (response.success) {
        setBatch(response.data)
        setErrorMessage(null)
      }
    } catch (error) {
      console.error('Failed to sync batch:', error)
      showApiErrorAlert(error)
    } finally {
      setSyncing(false)
    }
  }

  const handleResyncPrompts = async () => {
    if (!batch) return

    setResyncing(true)
    try {
      const response = await batchService.syncPrompts(batch.id)
      if (response.success) {
        const { resynced, stillFailed } = response.data

        if (resynced > 0) {
          alert(t('detail.alerts.resynced', { ns: 'batch', count: resynced }))
        }
        if (stillFailed > 0) {
          alert(t('detail.alerts.stillFailed', { ns: 'batch', count: stillFailed }))
        }
        if (resynced === 0 && stillFailed === 0) {
          alert(t('detail.alerts.none', { ns: 'batch' }))
        }

        setErrorMessage(null)
        void fetchBatch(false)
      }
    } catch (error) {
      console.error('Failed to resync prompts:', error)
      showApiErrorAlert(error)
    } finally {
      setResyncing(false)
    }
  }

  const handleAddPrompt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!batch || !newPrompt.userPrompt || isAttachmentPending) return

    try {
      const response = await batchService.addPrompt(batch.id, {
        label: newPrompt.label || undefined,
        systemPrompt: newPrompt.systemPrompt || undefined,
        userPrompt: newPrompt.userPrompt,
        attachments: newPrompt.attachments,
      })

      if (response.success) {
        setNewPrompt({ label: '', systemPrompt: '', userPrompt: '', attachments: [] })
        setAttachmentError(null)
        setErrorMessage(null)
        setExternalContextResetToken(prev => prev + 1)

        if (response.data) {
          setBatch(prev => {
            if (!prev) return prev
            return {
              ...prev,
              prompts: [...(prev.prompts || []), response.data],
            }
          })
        }

        void fetchBatch(false)
      }
    } catch (error) {
      console.error('Failed to add prompt:', error)
      showApiErrorAlert(error)
    }
  }

  const handleDeleteBatch = async () => {
    if (!batch || !confirm(t('detail.deleteBatchConfirm', { ns: 'batch' }))) return

    setDeleting(true)
    try {
      await batchService.deleteBatch(batch.id)
      toast.warning(t('detail.deleteBatchSuccess', { ns: 'batch' }))
      navigate('/batches')
    } catch (error) {
      console.error('Failed to delete batch:', error)
      showApiErrorAlert(error)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeletePrompt = async (promptId: number) => {
    if (!batch || !confirm(t('detail.deletePromptConfirm', { ns: 'batch' }))) return

    try {
      await batchService.deletePrompt(batch.id, promptId)
      setBatch(prev => {
        if (!prev) return prev
        return {
          ...prev,
          prompts: prev.prompts?.filter(prompt => prompt.id !== promptId) || [],
        }
      })
      setErrorMessage(null)
      void fetchBatch(false)
    } catch (error) {
      console.error('Failed to delete prompt:', error)
      showApiErrorAlert(error)
    }
  }

  if (loading && !batch) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">{t('detail.notFound', { ns: 'batch' })}</p>
        <Button variant="link" onClick={() => navigate('/batches')}>
          {t('actions.backToList', { ns: 'common' })}
        </Button>
      </div>
    )
  }

  const status = statusAppearanceMap[batch.status]
  const StatusIcon = status.icon

  return (
    <div className="space-y-8 pb-20">
      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/batches')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{batch.label}</h1>
          </div>
          <div className="ml-11 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Cpu className="h-4 w-4" /> {batch.model}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {t('labels.createdAt', { ns: 'common' })}:{' '}
              {format(new Date(batch.createdAt), 'yyyy-MM-dd HH:mm')}
            </div>
            {batch.submittedAt ? (
              <div className="flex items-center gap-1">
                <Send className="h-4 w-4" /> {t('labels.submittedAt', { ns: 'common' })}:{' '}
                {format(new Date(batch.submittedAt), 'yyyy-MM-dd HH:mm')}
              </div>
            ) : null}
            {batch.completedAt ? (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> {t('labels.completedAt', { ns: 'common' })}:{' '}
                {format(new Date(batch.completedAt), 'yyyy-MM-dd HH:mm')}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 md:mt-1">
          {batch.status === 'COMPLETED' &&
          batch.prompts?.some(
            prompt => prompt.status === 'PENDING' || prompt.status === 'FAILED'
          ) ? (
            <Button variant="outline" size="sm" onClick={handleResyncPrompts} disabled={resyncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${resyncing ? 'animate-spin' : ''}`} />
              {t('detail.resyncPrompts', { ns: 'batch' })}
            </Button>
          ) : null}

          {batch.status === 'DRAFT' ? (
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              disabled={deleting}
              onClick={() => void handleDeleteBatch()}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {t('detail.deleteBatch', { ns: 'batch' })}
            </Button>
          ) : null}

          <Badge
            className={`${status.color} flex h-8 items-center px-3 py-1.5 text-sm font-medium text-white`}
          >
            <StatusIcon
              className={`mr-2 h-4 w-4 ${batch.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`}
            />
            {batchStatusLabelMap[batch.status]}
          </Badge>

          {batch.status === 'IN_PROGRESS' ? (
            <Button variant="outline" size="sm" onClick={handleSyncBatch} disabled={syncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {t('detail.syncStatus', { ns: 'batch' })}
            </Button>
          ) : null}

          {batch.status === 'DRAFT' ? (
            <Button size="sm" onClick={handleSubmitBatch} disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {t('detail.submitBatch', { ns: 'batch' })}
            </Button>
          ) : null}
        </div>
      </div>

      {batch.errorMessage ? (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              {t('detail.errorTitle', { ns: 'batch' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 dark:text-red-300">{batch.errorMessage}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <MessageSquare className="h-5 w-5" />
            {t('detail.promptList', { ns: 'batch', count: batch.prompts?.length || 0 })}
          </h2>
        </div>

        {batch.status === 'DRAFT' ? (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              {batch.prompts?.map((prompt, index) => (
                <Card key={prompt.id} className="transition-colors hover:border-primary/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
                    <CardTitle className="text-base">
                      <Link
                        to={`/batches/${batch.id}/prompts/${prompt.id}`}
                        className="flex items-center gap-1 font-semibold text-primary hover:underline dark:text-primary-foreground"
                      >
                        {index + 1}. {prompt.label} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {t('detail.draftBadge', { ns: 'batch' })}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 px-4 py-2">
                    {prompt.systemPrompt ? (
                      <div className="rounded border bg-muted p-2 text-xs">
                        <span className="mb-1 block font-semibold text-foreground">
                          {t('detail.systemPrompt', { ns: 'batch' })}:
                        </span>
                        <p className="line-clamp-2 text-muted-foreground">{prompt.systemPrompt}</p>
                      </div>
                    ) : null}
                    <div className="text-sm">
                      <p className="line-clamp-3 whitespace-pre-wrap">{prompt.userPrompt}</p>
                    </div>
                    {(prompt.attachments?.length ?? 0) > 0 ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="h-3.5 w-3.5" />
                        {t('detail.attachmentCount', {
                          ns: 'batch',
                          count: prompt.attachments?.length ?? 0,
                        })}
                      </div>
                    ) : null}
                  </CardContent>
                  <CardFooter className="flex justify-end px-4 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeletePrompt(prompt.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {batch.prompts?.length === 0 ? (
                <div className="rounded-lg border border-dashed py-10 text-center">
                  <p className="text-muted-foreground">{t('detail.noPrompts', { ns: 'batch' })}</p>
                </div>
              ) : null}
            </div>

            <div className="lg:col-span-5">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('detail.addPromptTitle', { ns: 'batch' })}
                  </CardTitle>
                  <CardDescription>
                    {t('detail.addPromptDescription', { ns: 'batch' })}
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleAddPrompt}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="p-label" className="text-sm font-medium text-foreground">
                        {t('detail.labelField', { ns: 'batch' })}
                      </Label>
                      <Input
                        id="p-label"
                        placeholder={t('detail.labelPlaceholder', { ns: 'batch' })}
                        value={newPrompt.label}
                        onChange={event =>
                          setNewPrompt({ ...newPrompt, label: event.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="p-system" className="text-sm font-medium text-foreground">
                        {t('create.systemPromptLabel', { ns: 'batch' })}
                      </Label>
                      <Textarea
                        id="p-system"
                        placeholder={t('create.systemPromptPlaceholder', { ns: 'batch' })}
                        className="min-h-[80px] text-sm"
                        value={newPrompt.systemPrompt}
                        onChange={event =>
                          setNewPrompt({ ...newPrompt, systemPrompt: event.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="p-user" className="text-sm font-medium text-foreground">
                        {t('create.userPromptLabel', { ns: 'batch' })}
                      </Label>
                      <PromptTemplateSelect
                        onSelectTemplate={template =>
                          setNewPrompt(prev => ({ ...prev, userPrompt: template }))
                        }
                      />
                      <Textarea
                        id="p-user"
                        placeholder={t('create.userPromptPlaceholder', { ns: 'batch' })}
                        required
                        className="min-h-[150px] text-sm"
                        value={newPrompt.userPrompt}
                        onChange={event =>
                          setNewPrompt({ ...newPrompt, userPrompt: event.target.value })
                        }
                      />
                    </div>

                    <ExternalContextImportSection
                      disabled={isAttachmentPending}
                      resetToken={externalContextResetToken}
                      attachments={newPrompt.attachments}
                      onAttachmentsChange={attachments =>
                        setNewPrompt(prev => ({ ...prev, attachments }))
                      }
                    />

                    <PromptAttachmentsField
                      attachments={newPrompt.attachments}
                      errorMessage={attachmentError}
                      onChange={attachments => setNewPrompt({ ...newPrompt, attachments })}
                      onErrorChange={setAttachmentError}
                      onPendingChange={setIsAttachmentPending}
                    />
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!newPrompt.userPrompt || isAttachmentPending}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('detail.addPromptAction', { ns: 'batch' })}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {batch.prompts?.map(prompt => (
              <Card
                key={prompt.id}
                className="overflow-hidden transition-colors hover:border-primary/50"
              >
                <CardHeader className="flex flex-row items-center justify-between bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/batches/${batch.id}/prompts/${prompt.id}`}
                      className="flex items-center gap-1 text-lg font-bold text-primary hover:underline dark:text-primary-foreground"
                    >
                      {prompt.label} <ExternalLink className="h-3 w-3" />
                    </Link>
                    <Badge
                      variant={prompt.status === 'COMPLETED' ? 'default' : 'secondary'}
                      className="h-5 text-[10px]"
                    >
                      {promptStatusLabelMap[prompt.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion type="multiple" defaultValue={['input', 'output']} className="w-full">
                    <AccordionItem value="input" className="border-none">
                      <AccordionTrigger className="px-4 py-2 text-xs tracking-wider text-muted-foreground uppercase hover:no-underline">
                        {t('detail.userPromptInput', { ns: 'batch' })}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="max-h-[200px] overflow-y-auto rounded-md border bg-muted/50 p-4 text-sm whitespace-pre-wrap">
                          {prompt.userPrompt}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {(prompt.attachments?.length ?? 0) > 0 ? (
                      <AccordionItem value="attachments" className="border-none">
                        <AccordionTrigger className="px-4 py-2 text-xs tracking-wider text-muted-foreground uppercase hover:no-underline">
                          {t('detail.attachmentsSection', {
                            ns: 'batch',
                            count: prompt.attachments?.length ?? 0,
                          })}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-3">
                            {prompt.attachments?.map((attachment, index) => (
                              <div
                                key={`${attachment.fileName}-${index}`}
                                className="rounded-md border bg-muted/30 p-3"
                              >
                                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                                  {attachment.fileName}
                                </div>
                                <div className="max-h-[200px] overflow-y-auto rounded-md border bg-background p-3 font-mono text-xs break-all whitespace-pre-wrap">
                                  {attachment.fileContent}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ) : null}

                    {prompt.status === 'COMPLETED' && prompt.responseContent ? (
                      <AccordionItem value="output" className="border-none">
                        <AccordionTrigger className="px-4 py-2 text-xs font-semibold tracking-wider text-green-600 uppercase hover:no-underline dark:text-green-400">
                          {t('detail.answerSection', { ns: 'batch' })}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="prose prose-sm dark:prose-invert max-h-[400px] max-w-none overflow-y-auto rounded-md border bg-background p-4 shadow-sm">
                            <ReactMarkdown>{prompt.responseContent}</ReactMarkdown>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ) : null}

                    {prompt.errorMessage ? (
                      <div className="px-4 pb-4">
                        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                          <span className="mb-1 block font-bold">
                            {t('detail.errorLabel', { ns: 'batch' })}
                          </span>
                          {prompt.errorMessage}
                        </div>
                      </div>
                    ) : null}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center pt-8">
        <Button variant="outline" onClick={() => navigate('/batches')}>
          {t('actions.backToList', { ns: 'common' })}
        </Button>
      </div>
    </div>
  )
}
