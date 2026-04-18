import { CheckCircle2, ChevronDown, ChevronUp, CircleAlert, Loader2, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { Attachment, Model, PromptType } from '@/types/api'

import { ErrorAlert } from '@/components/feedback/ErrorAlert.tsx'
import { PageHeader } from '@/components/layout/PageHeader'
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
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { usePromptType, usePromptTypeLabels, useSupportedPromptTypes } from '@/hooks/usePromptType'
import { getApiErrorMessage } from '@/lib/api-error'
import { cn, isExternalContextFile } from '@/lib/utils'
import { batchService, modelService } from '@/services/api'

function StepStrip({
  currentStep,
  step1Label,
  step2Label,
}: {
  currentStep: 1 | 2
  step1Label: string
  step2Label: string
}) {
  const steps = [
    { key: 1, label: step1Label },
    { key: 2, label: step2Label },
  ] as const

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {steps.map(step => {
        const isCurrent = currentStep === step.key
        return (
          <div
            key={step.key}
            className={cn(
              'rounded-xl border px-4 py-3 transition-colors',
              isCurrent
                ? 'border-primary/40 bg-primary/5 text-foreground'
                : 'border-border bg-muted/20 text-muted-foreground'
            )}
          >
            <p className="text-xs font-semibold tracking-wide uppercase">{`Step ${step.key}`}</p>
            <p className="mt-1 text-sm font-medium">{step.label}</p>
          </div>
        )
      })}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium break-words">{value}</span>
    </div>
  )
}

function SummaryPanel({
  title,
  description,
  rows,
  notesTitle,
  notes,
}: {
  title: string
  description: string
  rows: Array<{ label: string; value: string }>
  notesTitle: string
  notes: string[]
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {rows.map(row => (
            <SummaryRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {notesTitle}
          </p>
          <div className="space-y-2">
            {notes.map(note => (
              <div key={note} className="rounded-lg bg-muted/30 px-3 py-2 text-sm text-foreground">
                {note}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function BatchCreatePage() {
  const { t } = useTranslation(['batch', 'common', 'external_context'])
  const navigate = useNavigate()
  const [models, setModels] = useState<Model[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [attachmentsErrorMessage, setAttachmentsErrorMessage] = useState<string | null>(null)
  const [attachmentsPending, setAttachmentsPending] = useState(false)
  const [formData, setFormData] = useState({
    batchLabel: '',
    model: '',
    promptLabel: '',
    systemPrompt: '',
    userPrompt: '',
    attachments: [] as Attachment[],
    promptType: 'TEXT' as PromptType,
    referenceMediaUrl: '',
  })

  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true)
      try {
        const response = await modelService.getModels()
        if (response.success) {
          setModels(response.data)
          setErrorMessage(null)
          if (response.data.length > 0) {
            const firstModel = response.data[0]
            const defaultType = firstModel.supportedPromptTypes?.[0] ?? 'TEXT'
            setFormData(prev => ({ ...prev, model: firstModel.id, promptType: defaultType }))
          }
        }
      } catch (error) {
        console.error('Failed to fetch models:', error)
        setErrorMessage(getApiErrorMessage(error))
      } finally {
        setLoadingModels(false)
      }
    }

    void fetchModels()
  }, [])

  const selectedModel = models.find(model => model.id === formData.model)
  const { supportedTypes, showTypeSelect } = useSupportedPromptTypes(selectedModel)
  const { isTextType, isEditType } = usePromptType(formData.promptType)
  const promptTypeLabels = usePromptTypeLabels()
  const regularAttachments = formData.attachments.filter(
    attachment => !isExternalContextFile(attachment.fileName)
  )
  const externalAttachments = formData.attachments.filter(attachment =>
    isExternalContextFile(attachment.fileName)
  )
  const hasSystemInstruction = formData.systemPrompt.trim().length > 0
  const hasUserPrompt = formData.userPrompt.trim().length > 0
  const referenceMediaMissing = isEditType && !formData.referenceMediaUrl.trim()
  const canSubmit =
    Boolean(formData.model) &&
    hasUserPrompt &&
    !referenceMediaMissing &&
    !attachmentsPending &&
    !submitting
  const currentStep: 1 | 2 = formData.model ? 2 : 1

  const validationMessages = [
    !formData.model ? t('create.validationModelRequired', { ns: 'batch' }) : null,
    !hasUserPrompt ? t('create.validationPromptRequired', { ns: 'batch' }) : null,
    referenceMediaMissing ? t('create.validationReferenceMediaRequired', { ns: 'batch' }) : null,
    attachmentsPending ? t('create.validationAttachmentsPending', { ns: 'batch' }) : null,
  ].filter((message): message is string => Boolean(message))

  const summaryRows = [
    {
      label: t('create.summary.model', { ns: 'batch' }),
      value: loadingModels
        ? t('create.summary.loading', { ns: 'batch' })
        : selectedModel?.displayName || t('create.summary.empty', { ns: 'batch' }),
    },
    {
      label: t('create.summary.promptType', { ns: 'batch' }),
      value: promptTypeLabels[formData.promptType] || t('create.summary.empty', { ns: 'batch' }),
    },
    {
      label: t('create.summary.attachments', { ns: 'batch' }),
      value: t('create.summary.count', { ns: 'batch', count: regularAttachments.length }),
    },
    {
      label: t('create.summary.externalContext', { ns: 'batch' }),
      value: t('create.summary.count', { ns: 'batch', count: externalAttachments.length }),
    },
    {
      label: t('create.summary.systemInstruction', { ns: 'batch' }),
      value: hasSystemInstruction
        ? t('create.summary.present', { ns: 'batch' })
        : t('create.summary.empty', { ns: 'batch' }),
    },
    {
      label: t('create.summary.referenceMedia', { ns: 'batch' }),
      value: isEditType
        ? formData.referenceMediaUrl.trim()
          ? t('create.summary.present', { ns: 'batch' })
          : t('create.summary.requiredSoon', { ns: 'batch' })
        : t('create.summary.notRequired', { ns: 'batch' }),
    },
    {
      label: t('create.summary.readiness', { ns: 'batch' }),
      value: canSubmit
        ? t('create.summary.ready', { ns: 'batch' })
        : t('create.summary.notReady', { ns: 'batch' }),
    },
  ]

  const summaryNotes = [
    hasSystemInstruction
      ? t('create.notes.systemInstructionPresent', { ns: 'batch' })
      : t('create.notes.systemInstructionEmpty', { ns: 'batch' }),
    isEditType
      ? formData.referenceMediaUrl.trim()
        ? t('create.notes.referenceMediaAdded', { ns: 'batch' })
        : t('create.notes.referenceMediaMissing', { ns: 'batch' })
      : t('create.notes.referenceMediaNotRequired', { ns: 'batch' }),
    externalAttachments.length > 0
      ? t('create.notes.externalContextReady', {
          ns: 'batch',
          count: externalAttachments.length,
        })
      : t('create.notes.externalContextEmpty', { ns: 'batch' }),
  ]

  const handleModelChange = (value: string) => {
    const model = models.find(item => item.id === value)
    const defaultType = model?.supportedPromptTypes?.[0] ?? 'TEXT'
    setFormData(prev => ({
      ...prev,
      model: value,
      promptType: defaultType,
      referenceMediaUrl: '',
    }))
  }

  const handlePromptTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      promptType: value as PromptType,
      referenceMediaUrl: '',
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formData.model || !hasUserPrompt || attachmentsPending) return

    setSubmitting(true)
    try {
      const response = await batchService.createBatch({
        label: formData.batchLabel || undefined,
        model: formData.model,
        prompt: {
          label: formData.promptLabel || undefined,
          systemPrompt:
            formData.promptType === 'TEXT' ? formData.systemPrompt || undefined : undefined,
          userPrompt: formData.userPrompt,
          attachments:
            formData.promptType === 'TEXT' && formData.attachments.length > 0
              ? formData.attachments
              : undefined,
          promptType: formData.promptType !== 'TEXT' ? formData.promptType : undefined,
          referenceMediaUrl: isEditType ? formData.referenceMediaUrl || undefined : undefined,
        },
      })

      if (response.success) {
        setErrorMessage(null)
        navigate(`/batches/${response.data.id}`)
      }
    } catch (error) {
      console.error('Failed to create batch:', error)
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-28">
      <PageHeader
        title={t('create.title', { ns: 'batch' })}
        description={t('create.pageDescription', { ns: 'batch' })}
        onBack={() => navigate(-1)}
      />

      <StepStrip
        currentStep={currentStep}
        step1Label={t('create.stepBatchSetup', { ns: 'batch' })}
        step2Label={t('create.stepFirstPrompt', { ns: 'batch' })}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="space-y-6">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="h-7 px-3">
                    {t('create.stepLabel', { ns: 'batch', step: 1 })}
                  </Badge>
                  <div>
                    <CardTitle>{t('create.stepBatchSetup', { ns: 'batch' })}</CardTitle>
                    <CardDescription>
                      {t('create.stepBatchSetupDescription', { ns: 'batch' })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="model">{t('create.modelLabel', { ns: 'batch' })}</Label>
                  <Select value={formData.model} onValueChange={handleModelChange}>
                    <SelectTrigger id="model">
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
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="batchLabel">{t('create.batchLabel', { ns: 'batch' })}</Label>
                  <Input
                    id="batchLabel"
                    placeholder={t('create.batchLabelPlaceholder', { ns: 'batch' })}
                    value={formData.batchLabel}
                    onChange={event =>
                      setFormData(prev => ({ ...prev, batchLabel: event.target.value }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="h-7 px-3">
                    {t('create.stepLabel', { ns: 'batch', step: 2 })}
                  </Badge>
                  <div>
                    <CardTitle>{t('create.stepFirstPrompt', { ns: 'batch' })}</CardTitle>
                    <CardDescription>
                      {t('create.stepFirstPromptDescription', { ns: 'batch' })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="promptLabel">{t('create.promptLabel', { ns: 'batch' })}</Label>
                    <Input
                      id="promptLabel"
                      placeholder={t('create.promptLabelPlaceholder', { ns: 'batch' })}
                      value={formData.promptLabel}
                      onChange={event =>
                        setFormData(prev => ({ ...prev, promptLabel: event.target.value }))
                      }
                    />
                  </div>

                  {showTypeSelect ? (
                    <div className="space-y-2">
                      <Label htmlFor="promptType">
                        {t('create.promptTypeLabel', { ns: 'batch' })}
                      </Label>
                      <Select value={formData.promptType} onValueChange={handlePromptTypeChange}>
                        <SelectTrigger id="promptType">
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
                </div>

                {isTextType ? (
                  <section className="rounded-xl border border-dashed bg-muted/20 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">
                            {t('create.optionalSystemInstructionTitle', { ns: 'batch' })}
                          </p>
                          <Badge variant={hasSystemInstruction ? 'default' : 'outline'}>
                            {hasSystemInstruction
                              ? t('create.systemInstructionAdded', { ns: 'batch' })
                              : t('create.systemInstructionEmpty', { ns: 'batch' })}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t('create.optionalSystemInstructionDescription', { ns: 'batch' })}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <PromptTemplateSelect
                          onSelectTemplate={({ systemPrompt, userPrompt }) => {
                            setShowSystemPrompt(true)
                            setFormData(prev => ({ ...prev, systemPrompt, userPrompt }))
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSystemPrompt(prev => !prev)}
                        >
                          {showSystemPrompt ? (
                            <ChevronUp className="mr-2 h-4 w-4" />
                          ) : (
                            <ChevronDown className="mr-2 h-4 w-4" />
                          )}
                          {showSystemPrompt
                            ? t('create.hideOptionalSystemInstruction', { ns: 'batch' })
                            : t('create.showOptionalSystemInstruction', { ns: 'batch' })}
                        </Button>
                      </div>
                    </div>

                    {showSystemPrompt ? (
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="systemPrompt">
                          {t('create.systemPromptLabel', { ns: 'batch' })}
                        </Label>
                        <Textarea
                          id="systemPrompt"
                          placeholder={t('create.systemPromptPlaceholder', { ns: 'batch' })}
                          className="min-h-28"
                          value={formData.systemPrompt}
                          onChange={event =>
                            setFormData(prev => ({ ...prev, systemPrompt: event.target.value }))
                          }
                        />
                      </div>
                    ) : null}
                  </section>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="userPrompt">{t('create.userPromptLabel', { ns: 'batch' })}</Label>
                  <Textarea
                    id="userPrompt"
                    placeholder={t('create.userPromptPlaceholder', { ns: 'batch' })}
                    className="min-h-56"
                    required
                    value={formData.userPrompt}
                    onChange={event =>
                      setFormData(prev => ({ ...prev, userPrompt: event.target.value }))
                    }
                  />
                </div>

                {isTextType ? (
                  <section className="space-y-4 rounded-xl border border-border/70 bg-background p-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">
                        {t('create.supplementaryInputsTitle', { ns: 'batch' })}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t('create.supplementaryInputsDescription', { ns: 'batch' })}
                      </p>
                    </div>

                    <ExternalContextImportSection
                      disabled={submitting || attachmentsPending}
                      attachments={formData.attachments}
                      onAttachmentsChange={attachments =>
                        setFormData(prev => ({ ...prev, attachments }))
                      }
                    />

                    <ExternalContextChipsDisplay
                      attachments={formData.attachments}
                      disabled={submitting}
                      onRemove={fileName =>
                        setFormData(prev => ({
                          ...prev,
                          attachments: prev.attachments.filter(
                            attachment => attachment.fileName !== fileName
                          ),
                        }))
                      }
                    />

                    <PromptAttachmentsField
                      attachments={formData.attachments}
                      disabled={submitting}
                      errorMessage={attachmentsErrorMessage}
                      onChange={attachments => setFormData(prev => ({ ...prev, attachments }))}
                      onErrorChange={setAttachmentsErrorMessage}
                      onPendingChange={setAttachmentsPending}
                    />
                  </section>
                ) : null}

                {isEditType ? (
                  <section className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">
                        {t('create.referenceMediaSectionTitle', { ns: 'batch' })}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t('create.referenceMediaSectionDescription', { ns: 'batch' })}
                      </p>
                    </div>
                    <ReferenceMediaSection
                      key={formData.promptType}
                      referenceMediaUrl={formData.referenceMediaUrl}
                      onReferenceMediaUrlChange={url =>
                        setFormData(prev => ({ ...prev, referenceMediaUrl: url }))
                      }
                    />
                  </section>
                ) : null}
              </CardContent>
            </Card>

            <div className="xl:hidden">
              <SummaryPanel
                title={t('create.summaryTitle', { ns: 'batch' })}
                description={t('create.summaryDescription', { ns: 'batch' })}
                rows={summaryRows}
                notesTitle={t('create.notesTitle', { ns: 'batch' })}
                notes={summaryNotes}
              />
            </div>
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-20">
              <SummaryPanel
                title={t('create.summaryTitle', { ns: 'batch' })}
                description={t('create.summaryDescription', { ns: 'batch' })}
                rows={summaryRows}
                notesTitle={t('create.notesTitle', { ns: 'batch' })}
                notes={summaryNotes}
              />
            </div>
          </aside>
        </div>

        <div className="sticky bottom-4 z-20 rounded-2xl border border-border bg-background/95 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80">
          <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                {canSubmit ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <CircleAlert className="h-4 w-4 text-amber-500" />
                )}
                <span>
                  {canSubmit
                    ? t('create.validationReady', { ns: 'batch' })
                    : t('create.validationNeedsAttention', { ns: 'batch' })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {validationMessages.length > 0
                  ? validationMessages.join(' · ')
                  : t('create.validationReadyDescription', { ns: 'batch' })}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                {t('actions.cancel', { ns: 'common' })}
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('create.creating', { ns: 'batch' })}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t('actions.create', { ns: 'common' })}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
