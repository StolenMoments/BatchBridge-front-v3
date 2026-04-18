import {
  AlertTriangle,
  FileText,
  Layers3,
  Loader2,
  Paperclip,
  RefreshCcw,
  Save,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import type { Attachment, BatchStatus, Model, Prompt, PromptType } from '@/types/api'

import { ErrorAlert } from '@/components/feedback/ErrorAlert'
import { MetaStrip } from '@/components/layout/MetaStrip'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/layout/StatusBadge'
import { ExternalContextChipsDisplay } from '@/components/prompt/ExternalContextChipsDisplay'
import { ExternalContextImportSection } from '@/components/prompt/ExternalContextImportSection'
import { PromptAttachmentsField } from '@/components/prompt/PromptAttachmentsField'
import { PromptTemplateSelect } from '@/components/prompt/PromptTemplateSelect'
import { ReferenceMediaSection } from '@/components/prompt/ReferenceMediaSection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { usePromptType, usePromptTypeLabels, useSupportedPromptTypes } from '@/hooks/usePromptType'
import { getApiErrorMessage, parseApiError, showApiErrorAlert } from '@/lib/api-error'
import { isDraftBatchEditable } from '@/lib/prompt-editability'
import { batchService, modelService } from '@/services/api'

function SummaryRow({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <div className="grid gap-1 rounded-2xl border bg-background/80 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {label}
        </span>
        <span className="text-sm font-semibold text-foreground">{value}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function haveAttachmentsChanged(current: Attachment[], next: Attachment[]) {
  if (current.length !== next.length) return true

  return current.some((attachment, index) => {
    const nextAttachment = next[index]
    return (
      attachment.fileName !== nextAttachment?.fileName ||
      attachment.fileContent !== nextAttachment?.fileContent
    )
  })
}

export function PromptEditPage() {
  const { t } = useTranslation(['prompt', 'common', 'batch'])
  const { batchId, promptId } = useParams<{ batchId: string; promptId: string }>()
  const navigate = useNavigate()

  const [reloadToken, setReloadToken] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null)
  const [batchModel, setBatchModel] = useState<string>('')
  const [batchLabel, setBatchLabel] = useState<string>('')
  const [models, setModels] = useState<Model[]>([])

  const [editLabel, setEditLabel] = useState('')
  const [editSystemPrompt, setEditSystemPrompt] = useState('')
  const [editUserPrompt, setEditUserPrompt] = useState('')
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([])
  const [editPromptType, setEditPromptType] = useState<PromptType>('TEXT')
  const [editReferenceMediaUrl, setEditReferenceMediaUrl] = useState('')
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [isAttachmentPending, setIsAttachmentPending] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!batchId || !promptId) return

      setLoading(true)
      setErrorMessage(null)

      const batchIdNum = Number.parseInt(batchId, 10)
      const promptIdNum = Number.parseInt(promptId, 10)

      const [promptResult, batchResult, modelsResult] = await Promise.allSettled([
        batchService.getPrompt(batchIdNum, promptIdNum),
        batchService.getBatch(batchIdNum),
        modelService.getModels(),
      ])

      let nextErrorMessage: string | null = null

      if (promptResult.status === 'fulfilled') {
        if (promptResult.value.success) {
          const nextPrompt = promptResult.value.data
          setPrompt(nextPrompt)
          setEditLabel(nextPrompt.label || '')
          setEditSystemPrompt(nextPrompt.systemPrompt || '')
          setEditUserPrompt(nextPrompt.userPrompt || '')
          setEditAttachments(nextPrompt.attachments ?? [])
          setEditPromptType(nextPrompt.promptType ?? 'TEXT')
          setEditReferenceMediaUrl(nextPrompt.referenceMediaUrl || '')
        } else {
          setPrompt(null)
        }
      } else {
        const promptError = parseApiError(promptResult.reason)
        if (promptError.code === 'PROMPT_NOT_FOUND') {
          setPrompt(null)
        } else {
          nextErrorMessage = getApiErrorMessage(promptResult.reason)
        }
      }

      if (batchResult.status === 'fulfilled') {
        if (batchResult.value.success) {
          setBatchStatus(batchResult.value.data.status)
          setBatchModel(batchResult.value.data.model)
          setBatchLabel(batchResult.value.data.label)
        } else {
          setBatchStatus(null)
          setBatchModel('')
          setBatchLabel('')
          nextErrorMessage ??= t('edit.fetchErrorDescription')
        }
      } else {
        setBatchStatus(null)
        setBatchModel('')
        setBatchLabel('')
        nextErrorMessage ??= getApiErrorMessage(batchResult.reason)
      }

      if (modelsResult.status === 'fulfilled' && modelsResult.value.success) {
        setModels(modelsResult.value.data)
      } else {
        setModels([])
      }

      setErrorMessage(nextErrorMessage)
      setLoading(false)
    }

    void fetchData()
  }, [batchId, promptId, reloadToken, t])

  const { isTextType, isEditType } = usePromptType(editPromptType)
  const currentModel = models.find(model => model.id === batchModel)
  const { supportedTypes, showTypeSelect } = useSupportedPromptTypes(currentModel)
  const promptTypeLabels = usePromptTypeLabels()
  const statusLabels = {
    DRAFT: t('status.draft', { ns: 'common' }),
    IN_PROGRESS: t('status.inProgress', { ns: 'common' }),
    COMPLETED: t('status.completed', { ns: 'common' }),
    FAILED: t('status.failed', { ns: 'common' }),
    PENDING: t('status.pending', { ns: 'common' }),
  } as const

  const attachmentsChanged = useMemo(
    () => (prompt ? haveAttachmentsChanged(prompt.attachments ?? [], editAttachments) : false),
    [prompt, editAttachments]
  )
  const recreationRequired = isTextType && attachmentsChanged
  const isSaveReady =
    !!editUserPrompt.trim() &&
    !(isTextType && isAttachmentPending) &&
    !(isEditType && !editReferenceMediaUrl.trim()) &&
    !isUpdating

  const saveReadinessDescription = useMemo(() => {
    if (isUpdating) return t('edit.summary.saveUpdating')
    if (!editUserPrompt.trim()) return t('edit.summary.saveNeedsPrompt')
    if (isTextType && isAttachmentPending) return t('edit.summary.savePendingAttachments')
    if (isEditType && !editReferenceMediaUrl.trim())
      return t('edit.summary.saveNeedsReferenceMedia')
    return t('edit.summary.saveReadyDescription')
  }, [
    editReferenceMediaUrl,
    editUserPrompt,
    isAttachmentPending,
    isEditType,
    isTextType,
    isUpdating,
    t,
  ])

  const referenceMediaValue = isEditType
    ? editReferenceMediaUrl.trim()
      ? t('edit.summary.referenceConfigured')
      : t('edit.summary.referenceMissing')
    : t('edit.summary.referenceNotRequired')

  const referenceMediaDescription = isEditType
    ? editReferenceMediaUrl.trim()
      ? t('edit.summary.referenceConfiguredDescription')
      : t('edit.summary.referenceMissingDescription')
    : t('edit.summary.referenceNotRequiredDescription')

  const hasFetchFailure = !!errorMessage && (!prompt || !batchStatus)
  const editBlockedReason = hasFetchFailure
    ? null
    : !prompt
      ? t('edit.blockedPromptMissing')
      : !isDraftBatchEditable(batchStatus)
        ? t('edit.blockedBatchStatus', {
            status: batchStatus ? statusLabels[batchStatus] : t('edit.notAllowed'),
          })
        : null

  const promptDetailTarget = prompt ? `/batches/${batchId}/prompts/${prompt.id}` : null
  const backTarget = promptDetailTarget ?? `/batches/${batchId}`

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!batchId || !promptId || !prompt || !isSaveReady) return

    setIsUpdating(true)
    try {
      const batchIdNumber = Number.parseInt(batchId, 10)
      const promptIdNumber = Number.parseInt(promptId, 10)

      if (recreationRequired) {
        const createResponse = await batchService.addPrompt(batchIdNumber, {
          label: editLabel || undefined,
          systemPrompt: editSystemPrompt || undefined,
          userPrompt: editUserPrompt,
          attachments: editAttachments,
          promptType: editPromptType !== 'TEXT' ? editPromptType : undefined,
        })

        if (createResponse.success) {
          await batchService.deletePrompt(batchIdNumber, promptIdNumber)
          navigate(`/batches/${batchId}/prompts/${createResponse.data.id}`, { replace: true })
        }
        return
      }

      const updateResponse = await batchService.updatePrompt(batchIdNumber, promptIdNumber, {
        label: editLabel,
        systemPrompt: isTextType ? editSystemPrompt : undefined,
        userPrompt: editUserPrompt,
        attachments: isTextType ? editAttachments : [],
        promptType: editPromptType !== 'TEXT' ? editPromptType : undefined,
        referenceMediaUrl: isEditType ? editReferenceMediaUrl || undefined : undefined,
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

  if (hasFetchFailure) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-10">
        {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

        <PageHeader
          onBack={() => navigate(backTarget)}
          title={t('detail.editTitle')}
          description={t('edit.fetchErrorDescription')}
        />

        <section className="rounded-[28px] border bg-muted/20 px-6 py-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {t('edit.fetchErrorTitle')}
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {t('edit.fetchErrorHelp')}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setReloadToken(token => token + 1)}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {t('edit.retryLoad')}
              </Button>
              <Button variant="outline" onClick={() => navigate(backTarget)}>
                {promptDetailTarget ? t('edit.backToDetail') : t('detail.backToBatch')}
              </Button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (editBlockedReason) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-10">
        {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

        <PageHeader
          onBack={() => navigate(backTarget)}
          title={t('detail.editTitle')}
          description={t('edit.blockedDescription')}
        />

        <section className="rounded-[28px] border bg-muted/20 px-6 py-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">{t('edit.blockedTitle')}</h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {editBlockedReason}
                </p>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {t('edit.blockedHelp')}
                </p>
              </div>
            </div>

            <Button variant="outline" onClick={() => navigate(backTarget)}>
              {promptDetailTarget ? t('edit.backToDetail') : t('detail.backToBatch')}
            </Button>
          </div>
        </section>
      </div>
    )
  }

  if (!prompt) {
    return null
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-28">
      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      <PageHeader
        onBack={() => navigate(backTarget)}
        title={editLabel.trim() || prompt.label}
        description={t('edit.description')}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={batchStatus ?? 'DRAFT'} size="sm" />
            <Badge variant="secondary" className="h-6 px-2 py-0.5 text-[10px] font-medium">
              {t('detail.editTitle')}
            </Badge>
          </div>
        }
      >
        <MetaStrip
          className="rounded-2xl border bg-muted/20 px-4 py-3"
          items={[
            {
              icon: Layers3,
              label: t('edit.metaBatchLabel'),
              value: batchLabel,
            },
            {
              icon: FileText,
              label: t('edit.metaPromptLabel'),
              value: prompt.label,
            },
            {
              icon: Sparkles,
              label: t('edit.metaPromptType'),
              value: promptTypeLabels[editPromptType],
            },
            {
              icon: Paperclip,
              label: t('edit.metaBatchStatus'),
              value: <StatusBadge status={batchStatus ?? 'DRAFT'} size="sm" />,
            },
            {
              icon: Sparkles,
              label: t('edit.metaPromptStatus'),
              value: <StatusBadge status={prompt.status} size="sm" />,
            },
          ]}
        />
      </PageHeader>

      <form
        id="prompt-edit-form"
        onSubmit={handleUpdate}
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
      >
        <div className="space-y-6">
          <section className="rounded-[28px] border bg-muted/10 p-6">
            <div className="grid gap-6 lg:grid-cols-2">
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
                <Label>{t('edit.currentState')}</Label>
                <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-2xl border bg-background/80 px-3 py-2">
                  <StatusBadge status={prompt.status} size="sm" />
                  <StatusBadge status={batchStatus ?? 'DRAFT'} size="sm" />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border bg-background p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-tight">{t('edit.formTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('edit.formDescription')}</p>
            </div>

            <div className="space-y-6">
              {showTypeSelect ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-type">{t('create.promptTypeLabel', { ns: 'batch' })}</Label>
                  <Select
                    value={editPromptType}
                    onValueChange={value => {
                      setEditPromptType(value as PromptType)
                      setEditReferenceMediaUrl('')
                    }}
                  >
                    <SelectTrigger id="edit-type">
                      <SelectValue
                        placeholder={t('create.promptTypePlaceholder', { ns: 'batch' })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(supportedTypes ?? []).map(type => (
                        <SelectItem key={type} value={type}>
                          {promptTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {isTextType ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Label htmlFor="edit-system">{t('detail.systemPrompt', { ns: 'batch' })}</Label>
                    <PromptTemplateSelect
                      onSelectTemplate={({ systemPrompt, userPrompt }) => {
                        setEditSystemPrompt(systemPrompt)
                        setEditUserPrompt(userPrompt)
                      }}
                    />
                  </div>
                  <Textarea
                    id="edit-system"
                    value={editSystemPrompt}
                    onChange={event => setEditSystemPrompt(event.target.value)}
                    placeholder={t('create.systemPromptPlaceholder', { ns: 'batch' })}
                    className="min-h-[100px]"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="edit-user">{t('detail.userPrompt')}</Label>
                <Textarea
                  id="edit-user"
                  value={editUserPrompt}
                  onChange={event => setEditUserPrompt(event.target.value)}
                  placeholder={t('detail.userPromptPlaceholder')}
                  required
                  className="min-h-[220px]"
                />
              </div>

              {isEditType ? (
                <div className="rounded-2xl border bg-muted/10 p-4">
                  <ReferenceMediaSection
                    key={editPromptType}
                    referenceMediaUrl={editReferenceMediaUrl}
                    onReferenceMediaUrlChange={setEditReferenceMediaUrl}
                  />
                </div>
              ) : null}

              {isTextType ? (
                <div className="space-y-5 rounded-2xl border bg-muted/10 p-4">
                  <ExternalContextImportSection
                    attachments={editAttachments}
                    disabled={isUpdating || isAttachmentPending}
                    promptId={promptId}
                    onAttachmentsChange={setEditAttachments}
                  />
                  <ExternalContextChipsDisplay
                    attachments={editAttachments}
                    onRemove={fileName =>
                      setEditAttachments(prev => prev.filter(item => item.fileName !== fileName))
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
              ) : null}
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          <Card className="border-border/70 bg-muted/10 shadow-none">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">{t('edit.summary.title')}</CardTitle>
              <CardDescription>{t('edit.summary.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow
                label={t('edit.summary.promptTypeLabel')}
                value={promptTypeLabels[editPromptType]}
                description={t('edit.summary.promptTypeDescription')}
              />
              <SummaryRow
                label={t('edit.summary.attachmentLabel')}
                value={
                  attachmentsChanged
                    ? t('edit.summary.attachmentChanged')
                    : t('edit.summary.attachmentUnchanged')
                }
                description={
                  attachmentsChanged
                    ? t('edit.summary.attachmentChangedDescription')
                    : t('edit.summary.attachmentUnchangedDescription')
                }
              />
              <SummaryRow
                label={t('edit.summary.referenceLabel')}
                value={referenceMediaValue}
                description={referenceMediaDescription}
              />
              <SummaryRow
                label={t('edit.summary.saveLabel')}
                value={
                  isSaveReady
                    ? t('edit.summary.saveReadyValue')
                    : t('edit.summary.saveBlockedValue')
                }
                description={saveReadinessDescription}
              />
            </CardContent>
          </Card>

          {recreationRequired ? (
            <section className="rounded-[24px] border bg-amber-500/8 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">{t('edit.recreateNoticeTitle')}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t('edit.recreateNoticeDescription')}
                  </p>
                </div>
              </div>
            </section>
          ) : null}
        </aside>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('edit.actionBarTitle')}</p>
            <p className="text-sm text-muted-foreground">
              {recreationRequired
                ? t('edit.actionBarRecreate')
                : isSaveReady
                  ? t('edit.actionBarReady')
                  : saveReadinessDescription}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(backTarget)}
              disabled={isUpdating || isAttachmentPending}
            >
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" form="prompt-edit-form" disabled={!isSaveReady}>
              {isUpdating || isAttachmentPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t('edit.saveAction')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
