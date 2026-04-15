import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { Attachment, Model, PromptType } from '@/types/api'

import { ErrorAlert } from '@/components/feedback/ErrorAlert.tsx'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { usePromptType, usePromptTypeLabels, useSupportedPromptTypes } from '@/hooks/usePromptType'
import { getApiErrorMessage } from '@/lib/api-error'
import { batchService, modelService } from '@/services/api'

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
    sourceMediaUrl: '',
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

  const selectedModel = models.find(m => m.id === formData.model)
  const { supportedTypes, showTypeSelect } = useSupportedPromptTypes(selectedModel)
  const { isTextType, isEditType } = usePromptType(formData.promptType)
  const promptTypeLabels = usePromptTypeLabels()

  const handleModelChange = (value: string) => {
    const model = models.find(m => m.id === value)
    const defaultType = model?.supportedPromptTypes?.[0] ?? 'TEXT'
    setFormData(prev => ({ ...prev, model: value, promptType: defaultType, sourceMediaUrl: '' }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formData.model || !formData.userPrompt || attachmentsPending) return

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
          sourceMediaUrl:
            formData.promptType === 'IMAGE_EDIT' || formData.promptType === 'VIDEO_EDIT'
              ? formData.sourceMediaUrl || undefined
              : undefined,
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{t('create.title', { ns: 'batch' })}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

        <Card>
          <CardHeader>
            <CardTitle>{t('create.batchInfoTitle', { ns: 'batch' })}</CardTitle>
            <CardDescription>{t('create.batchInfoDescription', { ns: 'batch' })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="batchLabel">{t('create.batchLabel', { ns: 'batch' })}</Label>
              <Input
                id="batchLabel"
                placeholder={t('create.batchLabelPlaceholder', { ns: 'batch' })}
                value={formData.batchLabel}
                onChange={event => setFormData({ ...formData, batchLabel: event.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('create.firstPromptTitle', { ns: 'batch' })}</CardTitle>
            <CardDescription>{t('create.firstPromptDescription', { ns: 'batch' })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promptLabel">{t('create.promptLabel', { ns: 'batch' })}</Label>
              <Input
                id="promptLabel"
                placeholder={t('create.promptLabelPlaceholder', { ns: 'batch' })}
                value={formData.promptLabel}
                onChange={event => setFormData({ ...formData, promptLabel: event.target.value })}
              />
            </div>

            {showTypeSelect ? (
              <div className="space-y-2">
                <Label htmlFor="promptType">{t('create.promptTypeLabel', { ns: 'batch' })}</Label>
                <Select
                  value={formData.promptType}
                  onValueChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      promptType: value as PromptType,
                      sourceMediaUrl: '',
                    }))
                  }
                >
                  <SelectTrigger id="promptType">
                    <SelectValue placeholder={t('create.promptTypePlaceholder', { ns: 'batch' })} />
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
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => setShowSystemPrompt(prev => !prev)}
                  >
                    {showSystemPrompt ? (
                      <ChevronUp className="mr-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="mr-1 h-4 w-4" />
                    )}
                    {t('create.systemPromptLabel', { ns: 'batch' })}
                  </Button>
                  <PromptTemplateSelect
                    onSelectTemplate={({ systemPrompt, userPrompt }) => {
                      setShowSystemPrompt(true)
                      setFormData(prev => ({ ...prev, systemPrompt, userPrompt }))
                    }}
                  />
                </div>
                {showSystemPrompt ? (
                  <Textarea
                    id="systemPrompt"
                    placeholder={t('create.systemPromptPlaceholder', { ns: 'batch' })}
                    className="min-h-25"
                    value={formData.systemPrompt}
                    onChange={event =>
                      setFormData({ ...formData, systemPrompt: event.target.value })
                    }
                  />
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="userPrompt">{t('create.userPromptLabel', { ns: 'batch' })}</Label>
              <Textarea
                id="userPrompt"
                placeholder={t('create.userPromptPlaceholder', { ns: 'batch' })}
                className="min-h-50"
                required
                value={formData.userPrompt}
                onChange={event => setFormData({ ...formData, userPrompt: event.target.value })}
              />
            </div>

            {isEditType ? (
              <div className="space-y-2">
                <Label htmlFor="sourceMediaUrl">
                  {t('create.sourceMediaUrlLabel', { ns: 'batch' })}
                </Label>
                <Input
                  id="sourceMediaUrl"
                  placeholder={t('create.sourceMediaUrlPlaceholder', { ns: 'batch' })}
                  value={formData.sourceMediaUrl}
                  onChange={event =>
                    setFormData({ ...formData, sourceMediaUrl: event.target.value })
                  }
                />
              </div>
            ) : null}

            {isTextType ? (
              <>
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
                      attachments: prev.attachments.filter(a => a.fileName !== fileName),
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
              </>
            ) : null}
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                !formData.model ||
                !formData.userPrompt ||
                (isTextType && attachmentsPending)
              }
            >
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
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
