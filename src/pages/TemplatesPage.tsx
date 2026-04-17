import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Inbox, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type { PromptTemplate, PromptTemplateRequest } from '@/types/api'

import { ErrorAlert } from '@/components/feedback/ErrorAlert'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getApiErrorMessage } from '@/lib/api-error'
import { templateService } from '@/services/api'

function TemplateFormDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: PromptTemplate
  onSaved: () => void
}) {
  const { t } = useTranslation(['prompt_template', 'common'])
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? '')
  const [userPrompt, setUserPrompt] = useState(initial?.userPrompt ?? '')
  const [systemPromptOpen, setSystemPromptOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [nameError, setNameError] = useState(false)
  const [userPromptError, setUserPromptError] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setDescription(initial?.description ?? '')
      setSystemPrompt(initial?.systemPrompt ?? '')
      setUserPrompt(initial?.userPrompt ?? '')
      setSystemPromptOpen(!!initial?.systemPrompt)
      setNameError(false)
      setUserPromptError(false)
    }
  }, [open, initial])

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
      if (initial) {
        await templateService.updateTemplate(initial.id, payload)
        toast.info(t('page.toast.updated'))
      } else {
        await templateService.createTemplate(payload)
        toast.info(t('page.toast.created'))
      }
      onSaved()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save template:', error)
      toast.error(initial ? t('page.toast.updateError') : t('page.toast.createError'))
    } finally {
      setSubmitting(false)
    }
  }

  const isEdit = !!initial

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('page.editDialog.title') : t('page.createDialog.title')}
          </DialogTitle>
        </DialogHeader>

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
              <>
                <Label htmlFor="tpl-system-prompt">{t('page.fields.systemPrompt')}</Label>
                <Textarea
                  id="tpl-system-prompt"
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  placeholder={t('page.fields.systemPromptPlaceholder')}
                  rows={4}
                />
              </>
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
              rows={5}
              className={userPromptError ? 'border-destructive' : ''}
            />
            {userPromptError ? (
              <p className="text-xs text-destructive">{t('page.validation.userPromptRequired')}</p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEdit ? t('actions.save', { ns: 'common' }) : t('actions.create', { ns: 'common' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TemplatesPage() {
  const { t } = useTranslation(['prompt_template', 'common'])
  const [templates, setTemplates] = useState<PromptTemplate[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | undefined>(undefined)
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

  const handleOpenCreate = () => {
    setEditingTemplate(undefined)
    setDialogOpen(true)
  }

  const handleOpenEdit = (template: PromptTemplate) => {
    setEditingTemplate(template)
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('page.deleteConfirm'))) return

    setDeletingId(id)
    try {
      await templateService.deleteTemplate(id)
      toast.warning(t('page.toast.deleted'))
      void fetchTemplates()
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast.error(t('page.toast.deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  const renderContent = () => {
    if (loading && !templates) {
      return (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    if (templates?.length === 0) {
      return (
        <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed">
          <Inbox className="mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t('page.empty')}</p>
          <Button variant="link" className="mt-4" onClick={handleOpenCreate}>
            {t('page.createFirst')}
          </Button>
        </div>
      )
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates?.map(template => (
          <Card key={template.id} className="flex h-full flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="truncate text-lg">{template.name}</CardTitle>
              {template.description ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
              ) : null}
            </CardHeader>
            <CardContent className="flex-1">
              <p className="line-clamp-3 text-sm text-muted-foreground">{template.userPrompt}</p>
            </CardContent>
            <CardFooter className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {t('page.createdAt')}: {format(new Date(template.createdAt), 'yyyy-MM-dd')}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(template)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  disabled={deletingId === template.id}
                  onClick={() => void handleDelete(template.id)}
                >
                  {deletingId === template.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

      {renderContent()}

      <TemplateFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editingTemplate}
        onSaved={() => void fetchTemplates()}
      />
    </div>
  )
}
