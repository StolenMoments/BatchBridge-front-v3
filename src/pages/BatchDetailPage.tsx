import { format } from 'date-fns'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import type { Attachment, Batch, BatchStatus, Model, PromptType } from '@/types/api'

import { BatchDraftPromptRow } from '@/components/batch/BatchDraftPromptRow'
import { BatchPromptSection } from '@/components/batch/BatchPromptSection'
import { ErrorAlert } from '@/components/feedback/ErrorAlert'
import { MetaStrip } from '@/components/layout/MetaStrip'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/layout/StatusBadge'
import { ExternalContextImportSection } from '@/components/prompt/ExternalContextImportSection'
import { PromptAttachmentsField } from '@/components/prompt/PromptAttachmentsField'
import { PromptTemplateSelect } from '@/components/prompt/PromptTemplateSelect'
import { ReferenceMediaSection } from '@/components/prompt/ReferenceMediaSection'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { usePromptType, usePromptTypeLabels, useSupportedPromptTypes } from '@/hooks/usePromptType'
import { getApiErrorMessage, showApiErrorAlert } from '@/lib/api-error'
import { batchService, modelService } from '@/services/api'

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
    promptType: 'TEXT' as PromptType,
    referenceMediaUrl: '',
  })
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [isAttachmentPending, setIsAttachmentPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [externalContextResetToken, setExternalContextResetToken] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState('')
  const [editModel, setEditModel] = useState('')
  const [models, setModels] = useState<Model[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoadingModels(true)
    modelService
      .getModels()
      .then(response => {
        if (response.success) setModels(response.data)
      })
      .catch(error => console.error('Failed to fetch models:', error))
      .finally(() => setLoadingModels(false))
  }, [])

  const currentBatchModel = models.find(m => m.id === batch?.model)
  const { supportedTypes: currentBatchSupportedTypes, showTypeSelect: showPromptTypeSelect } =
    useSupportedPromptTypes(currentBatchModel)
  const promptTypeLabels = usePromptTypeLabels()
  const { isEditType: newPromptIsEditType } = usePromptType(newPrompt.promptType)

  const promptCount = batch?.prompts?.length ?? 0
  const hasResyncablePrompts = Boolean(
    batch?.prompts?.some(prompt => prompt.status === 'PENDING' || prompt.status === 'FAILED')
  )

  const pageDescriptionMap: Record<BatchStatus, string> = {
    DRAFT: t('detail.descriptionDraft', { ns: 'batch' }),
    IN_PROGRESS: t('detail.descriptionInProgress', { ns: 'batch' }),
    COMPLETED: t('detail.descriptionCompleted', { ns: 'batch' }),
    FAILED: t('detail.descriptionFailed', { ns: 'batch' }),
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
    const isTextType = newPrompt.promptType === 'TEXT'
    if (
      !batch ||
      !newPrompt.userPrompt ||
      (isTextType && isAttachmentPending) ||
      (newPromptIsEditType && !newPrompt.referenceMediaUrl)
    )
      return

    const isEditType = newPromptIsEditType

    try {
      const response = await batchService.addPrompt(batch.id, {
        label: newPrompt.label || undefined,
        systemPrompt: isTextType ? newPrompt.systemPrompt || undefined : undefined,
        userPrompt: newPrompt.userPrompt,
        attachments: isTextType ? newPrompt.attachments : [],
        promptType: newPrompt.promptType !== 'TEXT' ? newPrompt.promptType : undefined,
        referenceMediaUrl: isEditType ? newPrompt.referenceMediaUrl || undefined : undefined,
      })

      if (response.success) {
        setNewPrompt({
          label: '',
          systemPrompt: '',
          userPrompt: '',
          attachments: [],
          promptType: currentBatchSupportedTypes?.[0] ?? 'TEXT',
          referenceMediaUrl: '',
        })
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

  const handleStartEdit = () => {
    if (!batch) return
    setEditLabel(batch.label)
    setEditModel(batch.model)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditLabel('')
    setEditModel('')
  }

  const handleSaveEdit = async () => {
    if (!batch) return
    const body: { label?: string; model?: string } = {}
    if (editLabel !== batch.label) body.label = editLabel
    if (editModel !== batch.model) body.model = editModel

    if (Object.keys(body).length === 0) {
      setIsEditing(false)
      return
    }

    setSaving(true)
    try {
      const response = await batchService.updateBatch(batch.id, body)
      if (response.success) {
        setBatch(response.data)
        setIsEditing(false)
        toast.info(t('detail.editSuccessTitle', { ns: 'batch' }), {
          description: t('detail.editSuccessDescription', { ns: 'batch' }),
        })
      }
    } catch (error) {
      console.error('Failed to update batch:', error)
      toast.error(t('detail.editError', { ns: 'batch' }))
    } finally {
      setSaving(false)
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

  const headerActions = (
    <>
      {batch.status === 'DRAFT' && !isEditing ? (
        <Button size="sm" onClick={handleSubmitBatch} disabled={submitting}>
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {t('detail.submitBatch', { ns: 'batch' })}
        </Button>
      ) : null}

      {(batch.status === 'COMPLETED' || batch.status === 'FAILED') && hasResyncablePrompts ? (
        <Button variant="outline" size="sm" onClick={handleResyncPrompts} disabled={resyncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${resyncing ? 'animate-spin' : ''}`} />
          {t('detail.resyncPrompts', { ns: 'batch' })}
        </Button>
      ) : null}

      {batch.status === 'IN_PROGRESS' ? (
        <Button variant="outline" size="sm" onClick={handleSyncBatch} disabled={syncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {t('detail.syncStatus', { ns: 'batch' })}
        </Button>
      ) : null}

      {batch.status === 'DRAFT' && !isEditing ? (
        <Button variant="outline" size="sm" onClick={handleStartEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          {t('actions.edit', { ns: 'common' })}
        </Button>
      ) : null}

      {isEditing ? (
        <>
          <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={saving}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            size="sm"
            onClick={() => void handleSaveEdit()}
            disabled={saving || loadingModels}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('actions.save', { ns: 'common' })}
          </Button>
        </>
      ) : null}

      {batch.status === 'DRAFT' && !isEditing ? (
        <Button
          variant="outline"
          size="sm"
          className="order-last border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 md:order-none dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
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
    </>
  )

  return (
    <div className="space-y-6 pb-20">
      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      <PageHeader
        onBack={() => navigate('/batches')}
        description={pageDescriptionMap[batch.status]}
        title={
          isEditing ? (
            <Input
              value={editLabel}
              onChange={e => setEditLabel(e.target.value)}
              className="max-w-sm text-xl font-bold"
            />
          ) : (
            batch.label
          )
        }
        meta={<StatusBadge status={batch.status} />}
        actions={headerActions}
      >
        <MetaStrip
          className="rounded-2xl border bg-muted/20 px-4 py-3"
          items={[
            ...(isEditing
              ? [
                  {
                    icon: Cpu,
                    label: t('detail.metaModel', { ns: 'batch' }),
                    value: (
                      <Select
                        value={editModel}
                        onValueChange={setEditModel}
                        disabled={loadingModels}
                      >
                        <SelectTrigger className="h-7 w-52 text-sm">
                          <SelectValue
                            placeholder={
                              loadingModels
                                ? t('create.modelLoading', { ns: 'batch' })
                                : t('create.modelPlaceholder', { ns: 'batch' })
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {models.map(model => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ),
                  },
                ]
              : [
                  {
                    icon: Cpu,
                    label: t('detail.metaModel', { ns: 'batch' }),
                    value: batch.model,
                  },
                ]),
            {
              icon: FileText,
              label: t('detail.metaPromptCount', { ns: 'batch' }),
              value: promptCount,
            },
            {
              icon: Clock,
              label: t('labels.createdAt', { ns: 'common' }),
              value: format(new Date(batch.createdAt), 'yyyy-MM-dd HH:mm'),
            },
            ...(batch.submittedAt
              ? [
                  {
                    icon: Send,
                    label: t('labels.submittedAt', { ns: 'common' }),
                    value: format(new Date(batch.submittedAt), 'yyyy-MM-dd HH:mm'),
                  },
                ]
              : []),
            ...(batch.completedAt
              ? [
                  {
                    icon: CheckCircle2,
                    label: t('labels.completedAt', { ns: 'common' }),
                    value: format(new Date(batch.completedAt), 'yyyy-MM-dd HH:mm'),
                  },
                ]
              : []),
            {
              icon: AlertTriangle,
              label: t('detail.metaBatchIssue', { ns: 'batch' }),
              value: batch.errorMessage
                ? t('detail.metaBatchIssuePresent', { ns: 'batch' })
                : t('detail.metaBatchIssueClear', { ns: 'batch' }),
            },
          ]}
        />
      </PageHeader>

      {batch.errorMessage ? (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              {t('detail.batchErrorNotice', { ns: 'batch' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 dark:text-red-300">{batch.errorMessage}</p>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              {batch.status === 'DRAFT' ? (
                <MessageSquare className="h-5 w-5" />
              ) : (
                <Bot className="h-5 w-5" />
              )}
              {t('detail.workspaceTitle', { ns: 'batch' })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {batch.status === 'DRAFT'
                ? t('detail.workspaceDescriptionDraft', { ns: 'batch' })
                : t('detail.workspaceDescriptionRuntime', { ns: 'batch' })}
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {t('detail.promptList', { ns: 'batch', count: promptCount })}
          </Badge>
        </div>

        {batch.status === 'DRAFT' ? (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <div className="rounded-2xl border bg-muted/10 px-4 py-3">
                <h3 className="text-sm font-semibold">{t('detail.listTitle', { ns: 'batch' })}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('detail.listDescription', { ns: 'batch' })}
                </p>
              </div>

              {batch.prompts && batch.prompts.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-background">
                  {batch.prompts.map((prompt, index) => (
                    <div
                      key={prompt.id}
                      className={index > 0 ? 'border-t border-border/60' : undefined}
                    >
                      <BatchDraftPromptRow
                        batchId={batch.id}
                        prompt={prompt}
                        index={index}
                        onDelete={handleDeletePrompt}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {batch.prompts?.length === 0 ? (
                <div className="rounded-2xl border border-dashed py-14 text-center">
                  <p className="font-medium">{t('detail.noPrompts', { ns: 'batch' })}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('detail.noPromptsHelper', { ns: 'batch' })}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="lg:col-span-5">
              <Card className="sticky top-20 border-border/70">
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
                    <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
                      {t('detail.composerHelper', { ns: 'batch' })}
                    </div>

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

                    {showPromptTypeSelect ? (
                      <div className="space-y-2">
                        <Label htmlFor="p-type" className="text-sm font-medium text-foreground">
                          {t('detail.promptTypeLabel', { ns: 'batch' })}
                        </Label>
                        <Select
                          value={newPrompt.promptType}
                          onValueChange={value =>
                            setNewPrompt(prev => ({
                              ...prev,
                              promptType: value as PromptType,
                              referenceMediaUrl: '',
                            }))
                          }
                        >
                          <SelectTrigger id="p-type">
                            <SelectValue
                              placeholder={t('detail.promptTypePlaceholder', { ns: 'batch' })}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {(currentBatchSupportedTypes ?? []).map(type => (
                              <SelectItem key={type} value={type}>
                                {promptTypeLabels[type]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}

                    {newPrompt.promptType === 'TEXT' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="p-system" className="text-sm font-medium text-foreground">
                            {t('create.systemPromptLabel', { ns: 'batch' })}
                          </Label>
                          <PromptTemplateSelect
                            onSelectTemplate={({ systemPrompt, userPrompt }) =>
                              setNewPrompt(prev => ({ ...prev, systemPrompt, userPrompt }))
                            }
                          />
                        </div>
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
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="p-user" className="text-sm font-medium text-foreground">
                        {t('create.userPromptLabel', { ns: 'batch' })}
                      </Label>
                      <Tabs defaultValue="text" className="flex w-full flex-col gap-3">
                        <TabsList variant="line" className="h-8 self-end">
                          <TabsTrigger value="text" className="px-3 py-1 text-xs">
                            {t('detail.textEntry', { ns: 'batch' })}
                          </TabsTrigger>
                          <TabsTrigger value="preview" className="px-3 py-1 text-xs">
                            {t('detail.previewLabel', { ns: 'batch' })}
                          </TabsTrigger>
                        </TabsList>
                        <div className="grid min-h-[180px] overflow-hidden rounded-xl border bg-background">
                          <TabsContent value="text" className="col-start-1 row-start-1 mt-0">
                            <Textarea
                              id="p-user"
                              placeholder={t('create.userPromptPlaceholder', { ns: 'batch' })}
                              required
                              className="min-h-[180px] resize-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                              value={newPrompt.userPrompt}
                              onChange={event =>
                                setNewPrompt({ ...newPrompt, userPrompt: event.target.value })
                              }
                            />
                          </TabsContent>
                          <TabsContent value="preview" className="col-start-1 row-start-1 mt-0">
                            <div className="prose prose-sm dark:prose-invert max-w-none p-4">
                              {newPrompt.userPrompt ? (
                                <ReactMarkdown>{newPrompt.userPrompt}</ReactMarkdown>
                              ) : (
                                <p className="text-muted-foreground">
                                  {t('detail.previewEmpty', { ns: 'batch' })}
                                </p>
                              )}
                            </div>
                          </TabsContent>
                        </div>
                      </Tabs>
                    </div>

                    {newPromptIsEditType ? (
                      <ReferenceMediaSection
                        referenceMediaUrl={newPrompt.referenceMediaUrl}
                        onReferenceMediaUrlChange={url =>
                          setNewPrompt(prev => ({ ...prev, referenceMediaUrl: url }))
                        }
                      />
                    ) : null}

                    {newPrompt.promptType === 'TEXT' ? (
                      <>
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
                      </>
                    ) : null}
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        !newPrompt.userPrompt ||
                        (newPrompt.promptType === 'TEXT' && isAttachmentPending) ||
                        (newPromptIsEditType && !newPrompt.referenceMediaUrl)
                      }
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
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background">
            {batch.prompts?.map((prompt, index) => (
              <div key={prompt.id} className={index > 0 ? 'border-t border-border/60' : undefined}>
                <BatchPromptSection batchId={batch.id} prompt={prompt} />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-center pt-8">
        <Button variant="outline" onClick={() => navigate('/batches')}>
          {t('actions.backToList', { ns: 'common' })}
        </Button>
      </div>
    </div>
  )
}
