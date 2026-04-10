import { BookOpen, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { PromptTemplate } from '@/types/api'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getApiErrorMessage } from '@/lib/api-error'
import { templateService } from '@/services/api'

interface PromptTemplateSelectProps {
  disabled?: boolean
  onSelectTemplate: (systemPrompt: string, userPrompt: string) => void
}

export function PromptTemplateSelect({
  disabled = false,
  onSelectTemplate,
}: PromptTemplateSelectProps) {
  const { t } = useTranslation('prompt_template')
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = async () => {
    setOpen(true)
    setLoading(true)
    setError(null)
    try {
      const response = await templateService.getTemplates()
      if (response.success) {
        setTemplates(response.data)
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (template: PromptTemplate) => {
    onSelectTemplate(template.systemPrompt ?? '', template.userPrompt)
    setOpen(false)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => void handleOpen()}
      >
        <BookOpen className="mr-2 h-4 w-4" />
        {t('loader.button')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('loader.modalTitle')}</DialogTitle>
            <DialogDescription>{t('loader.replaceNotice')}</DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <p className="py-4 text-center text-sm text-destructive">{error}</p>
            ) : templates.length === 0 ? (
              <div className="py-10 text-center">
                <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t('loader.empty')}</p>
              </div>
            ) : (
              templates.map(template => (
                <button
                  key={template.id}
                  type="button"
                  className="w-full rounded-md border bg-card px-4 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => handleSelect(template)}
                >
                  <p className="text-sm font-semibold">{template.name}</p>
                  {template.description ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{template.description}</p>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
