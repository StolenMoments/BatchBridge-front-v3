import { BookOpen, Loader2 } from 'lucide-react'
import { useEffect, useReducer, useState } from 'react'
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

export interface SelectedTemplate {
  systemPrompt: string
  userPrompt: string
}

interface PromptTemplateSelectProps {
  disabled?: boolean
  onSelectTemplate: (template: SelectedTemplate) => void
}

type DialogState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; templates: PromptTemplate[] }
  | { status: 'error'; message: string }

type DialogAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; templates: PromptTemplate[] }
  | { type: 'FETCH_ERROR'; message: string }
  | { type: 'RESET' }

function reducer(_state: DialogState, action: DialogAction): DialogState {
  switch (action.type) {
    case 'FETCH_START':
      return { status: 'loading' }
    case 'FETCH_SUCCESS':
      return { status: 'success', templates: action.templates }
    case 'FETCH_ERROR':
      return { status: 'error', message: action.message }
    case 'RESET':
      return { status: 'idle' }
  }
}

export function PromptTemplateSelect({
  disabled = false,
  onSelectTemplate,
}: PromptTemplateSelectProps) {
  const { t } = useTranslation('prompt_template')
  const [open, setOpen] = useState(false)
  const [state, dispatch] = useReducer(reducer, { status: 'idle' })

  useEffect(() => {
    // idle 상태에서 모달이 열릴 때만 fetch (success/loading/error면 재요청 안 함)
    if (!open || state.status !== 'idle') return

    const fetchTemplates = async () => {
      dispatch({ type: 'FETCH_START' })
      try {
        const response = await templateService.getTemplates()
        if (response.success) {
          dispatch({ type: 'FETCH_SUCCESS', templates: response.data })
        }
      } catch (err) {
        dispatch({ type: 'FETCH_ERROR', message: getApiErrorMessage(err) })
      }
    }

    void fetchTemplates()
  }, [open, state.status])

  const handleSelect = (template: PromptTemplate) => {
    onSelectTemplate({
      systemPrompt: template.systemPrompt ?? '',
      userPrompt: template.userPrompt ?? '',
    })
    setOpen(false)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <BookOpen className="mr-2 h-4 w-4" />
        {t('loader.button')}
      </Button>

      <Dialog
        open={open}
        onOpenChange={next => {
          // 에러 상태에서 닫으면 idle로 리셋해 다음 열림 시 재시도 가능하게 함
          if (!next && state.status === 'error') dispatch({ type: 'RESET' })
          setOpen(next)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('loader.modalTitle')}</DialogTitle>
            <DialogDescription>{t('loader.replaceNotice')}</DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-2">
            {state.status === 'loading' || state.status === 'idle' ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : state.status === 'error' ? (
              <p className="py-4 text-center text-sm text-destructive">{state.message}</p>
            ) : state.templates.length === 0 ? (
              <div className="py-10 text-center">
                <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t('loader.empty')}</p>
              </div>
            ) : (
              state.templates.map(template => (
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
