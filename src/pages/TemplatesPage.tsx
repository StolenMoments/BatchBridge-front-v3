import { format } from 'date-fns'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type { PromptTemplate, PromptTemplateRequest } from '@/types/api'

import { ErrorAlert } from '@/components/feedback/ErrorAlert'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getApiErrorMessage } from '@/lib/api-error'
import { templateService } from '@/services/api'

// ---------------------------------------------------------------------------
// Inline Editor Panel
// ---------------------------------------------------------------------------

function TemplateEditorPanel({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: PromptTemplate
  onSaved: (saved: PromptTemplate) => void
  onCancel: () => void
}) {
  const { t } = useTranslation(['prompt_template', 'common'])
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? '')
  const [userPrompt, setUserPrompt] = useState(initial?.userPrompt ?? '')
  const [systemPromptOpen, setSystemPromptOpen] = useState(!!initial?.systemPrompt)
  const [submitting, setSubmitting] = useState(false)
  const [nameError, setNameError] = useState(false)
  const [userPromptError, setUserPromptError] = useState(false)

  const isEdit = !!initial

  const handleSubmit = async () => {
    let valid = true
    if (!name.trim()) {
      setNameError(true)
      valid = false
    }
    if (!userPrompt.trim()) {
      setUserPromptError(true)
      valid = false
    }
    if (!valid) return

    const payload: PromptTemplateRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      systemPrompt: systemPrompt.trim() || undefined,
      userPrompt: userPrompt.trim(),
    }

    setSubmitting(true)
    try {
      let result: PromptTemplate
      if (initial) {
        const res = await templateService.updateTemplate(initial.id, payload)
        result = res.data
        toast.info(t('page.toast.updated'))
      } else {
        const res = await templateService.createTemplate(payload)
        result = res.data
        toast.info(t('page.toast.created'))
      }
      onSaved(result)
    } catch (error) {
      console.error('Failed to save template:', error)
      toast.error(isEdit ? t('page.toast.updateError') : t('page.toast.createError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-5 py-4">
        <h2 className="text-base font-semibold">
          {isEdit ? t('page.editor.editTitle') : t('page.editor.createTitle')}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">{t('page.fields.name')}</Label>
            <Input
              id="tpl-name"
              value={name}
              onChange={e => {
                setName(e.target.value)
                if (e.target.value.trim()) setNameError(false)
              }}
              placeholder={t('page.fields.namePlaceholder')}
              className={nameError ? 'border-destructive' : ''}
            />
            {nameError ? (
              <p className="text-xs text-destructive">{t('page.validation.nameRequired')}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-description">{t('page.fields.description')}</Label>
            <Input
              id="tpl-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('page.fields.descriptionPlaceholder')}
            />
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setSystemPromptOpen(prev => !prev)}
            >
              {systemPromptOpen ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  {t('page.systemPromptToggle.hide')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  {t('page.systemPromptToggle.show')}
                </>
              )}
            </button>
            {systemPromptOpen ? (
              <Textarea
                id="tpl-system-prompt"
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                placeholder={t('page.fields.systemPromptPlaceholder')}
                rows={4}
              />
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-user-prompt">{t('page.fields.userPrompt')}</Label>
            <Textarea
              id="tpl-user-prompt"
              value={userPrompt}
              onChange={e => {
                setUserPrompt(e.target.value)
                if (e.target.value.trim()) setUserPromptError(false)
              }}
              placeholder={t('page.fields.userPromptPlaceholder')}
              rows={6}
              className={userPromptError ? 'border-destructive' : ''}
            />
            {userPromptError ? (
              <p className="text-xs text-destructive">{t('page.validation.userPromptRequired')}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
          {t('actions.cancel', { ns: 'common' })}
        </Button>
        <Button size="sm" onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isEdit ? t('actions.save', { ns: 'common' }) : t('actions.create', { ns: 'common' })}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Preview Panel
// ---------------------------------------------------------------------------

function TemplatePreviewPanel({
  template,
  deleting,
  onEdit,
  onDelete,
}: {
  template: PromptTemplate
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation(['prompt_template', 'common'])

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-5 py-4">
        <h2 className="truncate text-base font-semibold">{template.name}</h2>
        {template.description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{template.description}</p>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-5">
          {template.systemPrompt ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t('page.preview.systemPrompt')}
              </p>
              <pre className="rounded-md bg-muted/40 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                {template.systemPrompt}
              </pre>
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('page.preview.userPrompt')}
            </p>
            <pre className="rounded-md bg-muted/40 p-3 text-sm leading-relaxed whitespace-pre-wrap">
              {template.userPrompt}
            </pre>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t px-5 py-3">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          {t('actions.edit', { ns: 'common' })}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={deleting}
          onClick={onDelete}
        >
          {deleting ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          )}
          {t('actions.delete', { ns: 'common' })}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function TemplatesPage() {
  const { t } = useTranslation(['prompt_template', 'common'])
  const [templates, setTemplates] = useState<PromptTemplate[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [panelMode, setPanelMode] = useState<'preview' | 'create' | 'edit'>('preview')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await templateService.getTemplates()
      if (response.success) {
        setTemplates(response.data)
        setErrorMessage(null)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchTemplates()
  }, [])

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template)
    setPanelMode('preview')
  }

  const handleOpenCreate = () => {
    setSelectedTemplate(null)
    setPanelMode('create')
  }

  const handleOpenEdit = () => {
    setPanelMode('edit')
  }

  const handleDelete = async () => {
    if (!selectedTemplate) return
    if (!confirm(t('page.deleteConfirm'))) return

    const id = selectedTemplate.id
    setDeletingId(id)
    try {
      await templateService.deleteTemplate(id)
      toast.warning(t('page.toast.deleted'))
      setSelectedTemplate(null)
      setPanelMode('preview')
      void fetchTemplates()
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast.error(t('page.toast.deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaved = async (saved: PromptTemplate) => {
    await fetchTemplates()
    // Re-select the saved template in preview mode
    setSelectedTemplate(saved)
    setPanelMode('preview')
  }

  const handleCancelEditor = () => {
    setPanelMode('preview')
  }

  const handleBackToList = () => {
    setSelectedTemplate(null)
    setPanelMode('preview')
  }

  // Mobile visibility logic
  const mobileShowPanel = !!selectedTemplate || panelMode !== 'preview'

  // ---------------------------------------------------------------------------
  // Left Panel: Template List
  // ---------------------------------------------------------------------------

  const renderList = () => {
    if (loading && !templates) {
      return (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )
    }

    if (!templates || templates.length === 0) {
      return (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
          <Inbox className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('page.empty')}</p>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-sm"
            onClick={handleOpenCreate}
          >
            {t('page.createFirst')}
          </Button>
        </div>
      )
    }

    return (
      <div className="divide-y overflow-hidden rounded-lg border">
        {templates.map(template => {
          const isSelected = selectedTemplate?.id === template.id
          return (
            <button
              key={template.id}
              type="button"
              className={[
                'flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                isSelected
                  ? 'border-l-2 border-primary bg-primary/5 hover:bg-primary/5'
                  : 'border-l-2 border-transparent',
              ].join(' ')}
              onClick={() => handleSelectTemplate(template)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{template.name}</span>
                {template.systemPrompt ? (
                  <Badge variant="secondary" className="shrink-0 text-[10px] leading-none">
                    {t('page.hasSystemPrompt')}
                  </Badge>
                ) : null}
              </div>
              {template.description ? (
                <p className="line-clamp-1 text-xs text-muted-foreground">{template.description}</p>
              ) : null}
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {t('page.updatedAt')} {format(new Date(template.updatedAt), 'yyyy-MM-dd')}
              </p>
            </button>
          )
        })}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Right Panel
  // ---------------------------------------------------------------------------

  const renderRightPanel = () => {
    if (panelMode === 'create') {
      return (
        <TemplateEditorPanel
          onSaved={saved => void handleSaved(saved)}
          onCancel={handleCancelEditor}
        />
      )
    }

    if (panelMode === 'edit' && selectedTemplate) {
      return (
        <TemplateEditorPanel
          initial={selectedTemplate}
          onSaved={saved => void handleSaved(saved)}
          onCancel={handleCancelEditor}
        />
      )
    }

    if (selectedTemplate) {
      return (
        <TemplatePreviewPanel
          template={selectedTemplate}
          deleting={deletingId === selectedTemplate.id}
          onEdit={handleOpenEdit}
          onDelete={() => void handleDelete()}
        />
      )
    }

    // Nothing selected
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{t('page.preview.empty')}</p>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('page.title')}
        description={t('page.description')}
        actions={
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('page.newTemplate')}
          </Button>
        }
      />

      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      {/* Desktop: side-by-side split view */}
      <div className="hidden md:flex md:gap-0 md:overflow-hidden md:rounded-lg md:border">
        {/* Left: list */}
        <div className="flex w-2/5 flex-col border-r">
          <div className="border-b px-4 py-3">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('page.title')}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">{renderList()}</div>
        </div>

        {/* Right: preview / editor */}
        <div className="flex min-h-[520px] w-3/5 flex-col">{renderRightPanel()}</div>
      </div>

      {/* Mobile: conditional stack */}
      <div className="md:hidden">
        {!mobileShowPanel ? (
          <div className="space-y-3">{renderList()}</div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <div className="border-b px-4 py-2.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto gap-1 p-0 text-sm"
                onClick={handleBackToList}
              >
                <ArrowLeft className="h-4 w-4" />
                {t('page.backToList')}
              </Button>
            </div>
            <div className="min-h-[400px]">{renderRightPanel()}</div>
          </div>
        )}
      </div>
    </div>
  )
}
