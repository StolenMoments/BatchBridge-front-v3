import { Check, ExternalLink, Loader2, Plus, Ticket, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Attachment, ContextPreviewResponse, ContextPreviewSource } from '@/types/api'
import type { KeyboardEvent } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import { externalContextService } from '@/services/api'

interface ExternalContextImportSectionProps {
  attachments: Attachment[]
  disabled?: boolean
  onAttachmentsChange: (attachments: Attachment[]) => void
}

type ToastTone = 'success' | 'warning' | 'error'

interface ToastItem {
  id: number
  title: string
  description: string
  tone: ToastTone
  phase: 'entering' | 'visible' | 'exiting'
  progressStarted: boolean
}

function sanitizeToken(value: string): string {
  return value.trim().replace(/\s+/g, '')
}

function appendUniqueToken(items: string[], value: string): string[] {
  const normalized = sanitizeToken(value)
  if (!normalized || items.includes(normalized)) return items
  return [...items, normalized]
}

function buildAttachmentFileName(): string {
  const timestamp = new Date().toISOString().replaceAll(':', '-')
  return `context-preview-${timestamp}.md`
}

function getSourceTypeLabel(
  t: ReturnType<typeof useTranslation>['t'],
  source: ContextPreviewSource
): string {
  if (source.type === 'GITHUB_PR') return t('sources.github')
  if (source.type === 'JIRA') return t('sources.jira')
  return t('sources.confluence')
}

function getToastClasses(tone: ToastTone): string {
  if (tone === 'success') return 'border-l-sky-500'
  if (tone === 'warning') return 'border-l-amber-500'
  return 'border-l-destructive'
}

function getBadgeClasses(source: ContextPreviewSource): string {
  if (source.status === 'SUCCESS') {
    return 'border-sky-200 bg-sky-50 text-sky-700'
  }

  return 'border-amber-200 bg-amber-50 text-amber-700'
}

export function ExternalContextImportSection({
  attachments,
  disabled = false,
  onAttachmentsChange,
}: ExternalContextImportSectionProps) {
  const { t } = useTranslation('external_context')
  const jiraInputId = useId()
  const confluenceInputId = useId()
  const toastIdRef = useRef(1)
  const [githubPrUrl, setGithubPrUrl] = useState('')
  const [jiraDraft, setJiraDraft] = useState('')
  const [jiraKeys, setJiraKeys] = useState<string[]>([])
  const [confluenceDraft, setConfluenceDraft] = useState('')
  const [confluencePageIds, setConfluencePageIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [preview, setPreview] = useState<ContextPreviewResponse | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    if (toasts.length === 0) return

    const timers = toasts.flatMap(toast => {
      const nextTimers: number[] = []

      if (toast.phase === 'entering') {
        nextTimers.push(
          window.setTimeout(() => {
            setToasts(prev =>
              prev.map(item =>
                item.id === toast.id ? { ...item, phase: 'visible', progressStarted: true } : item
              )
            )
          }, 10)
        )
      }

      if (toast.phase === 'visible') {
        nextTimers.push(
          window.setTimeout(() => {
            setToasts(prev =>
              prev.map(item => (item.id === toast.id ? { ...item, phase: 'exiting' } : item))
            )
          }, 3000)
        )
      }

      if (toast.phase === 'exiting') {
        nextTimers.push(
          window.setTimeout(() => {
            setToasts(prev => prev.filter(item => item.id !== toast.id))
          }, 300)
        )
      }

      return nextTimers
    })

    return () => {
      timers.forEach(timer => window.clearTimeout(timer))
    }
  }, [toasts])

  const pushToast = (tone: ToastTone, title: string, description: string) => {
    const nextToast: ToastItem = {
      id: toastIdRef.current,
      tone,
      title,
      description,
      phase: 'entering',
      progressStarted: false,
    }

    toastIdRef.current += 1

    setToasts(prev => [nextToast, ...prev].slice(0, 3))
  }

  const addChip = (
    value: string,
    items: string[],
    setter: (nextItems: string[]) => void,
    invalidMessage: string
  ) => {
    const normalized = sanitizeToken(value)
    if (!normalized) return false

    if (items.includes(normalized)) {
      pushToast('warning', t('messages.duplicateTitle'), invalidMessage)
      return true
    }

    setter([...items, normalized])
    return true
  }

  const handleChipKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    value: string,
    items: string[],
    setter: (nextItems: string[]) => void,
    reset: () => void,
    invalidMessage: string
  ) => {
    if (event.key !== 'Enter') return

    event.preventDefault()
    const added = addChip(value, items, setter, invalidMessage)
    if (added) {
      reset()
      setPreview(null)
      setErrorMessage(null)
    }
  }

  const removeChip = (value: string, items: string[], setter: (nextItems: string[]) => void) => {
    setter(items.filter(item => item !== value))
    setPreview(null)
    setErrorMessage(null)
  }

  const handlePreview = async () => {
    const nextJiraKeys = appendUniqueToken(jiraKeys, jiraDraft)
    const nextConfluencePageIds = appendUniqueToken(confluencePageIds, confluenceDraft)
    const nextGithubPrUrl = githubPrUrl.trim()

    if (!nextGithubPrUrl && nextJiraKeys.length === 0 && nextConfluencePageIds.length === 0) {
      setErrorMessage(t('errors.emptySources'))
      setPreview(null)
      return
    }

    if (nextJiraKeys !== jiraKeys) {
      setJiraKeys(nextJiraKeys)
      setJiraDraft('')
    }

    if (nextConfluencePageIds !== confluencePageIds) {
      setConfluencePageIds(nextConfluencePageIds)
      setConfluenceDraft('')
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await externalContextService.preview({
        githubPrUrl: nextGithubPrUrl || undefined,
        jiraKeys: nextJiraKeys,
        confluencePageIds: nextConfluencePageIds,
      })

      if (!response.success) {
        const message = response.error?.message || t('messages.requestFailedDescription')
        setPreview(null)
        setErrorMessage(message)
        pushToast('error', t('messages.requestFailedTitle'), message)
        return
      }

      setPreview(response.data)

      const successCount = response.data.sources.filter(
        source => source.status === 'SUCCESS'
      ).length
      const failedCount = response.data.sources.length - successCount

      if (failedCount === 0) {
        pushToast(
          'success',
          t('messages.successTitle'),
          t('messages.successDescription', { count: successCount })
        )
      } else if (successCount > 0) {
        pushToast(
          'warning',
          t('messages.partialTitle'),
          t('messages.partialDescription', { successCount, failedCount })
        )
      } else {
        pushToast('error', t('messages.requestFailedTitle'), t('messages.requestFailedDescription'))
      }
    } catch (error) {
      const message = getApiErrorMessage(error)
      setPreview(null)
      setErrorMessage(message)
      pushToast('error', t('messages.requestFailedTitle'), message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!preview?.contextText.trim()) {
      pushToast('error', t('messages.confirmFailedTitle'), t('messages.confirmFailedDescription'))
      return
    }

    onAttachmentsChange([
      ...attachments,
      {
        fileName: buildAttachmentFileName(),
        fileContent: preview.contextText,
      },
    ])

    setPreview(null)
    pushToast('success', t('messages.savedTitle'), t('messages.savedDescription'))
  }

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="external-context" className="rounded-xl border bg-muted/20 px-4">
          <AccordionTrigger className="py-4 hover:no-underline">
            <div className="space-y-1 text-left">
              <p className="text-base font-semibold">{t('title')}</p>
              <p className="text-sm font-normal text-muted-foreground">{t('description')}</p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <Card className="border-dashed bg-background/80 shadow-xs">
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="github-pr-url">{t('fields.githubPrUrl')}</Label>
                  <Input
                    id="github-pr-url"
                    value={githubPrUrl}
                    disabled={disabled || loading}
                    placeholder={t('placeholders.githubPrUrl')}
                    onChange={event => {
                      setGithubPrUrl(event.target.value)
                      setPreview(null)
                      setErrorMessage(null)
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor={jiraInputId}>{t('fields.jiraKeys')}</Label>
                  <Input
                    id={jiraInputId}
                    value={jiraDraft}
                    disabled={disabled || loading}
                    placeholder={t('placeholders.jiraKeys')}
                    onChange={event => setJiraDraft(event.target.value)}
                    onKeyDown={event =>
                      handleChipKeyDown(
                        event,
                        jiraDraft,
                        jiraKeys,
                        setJiraKeys,
                        () => setJiraDraft(''),
                        t('messages.duplicateJira')
                      )
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    {jiraKeys.map(item => (
                      <Badge key={item} variant="outline" className="h-7 gap-1 px-3">
                        <Ticket className="h-3 w-3" />
                        {item}
                        <button
                          type="button"
                          className="rounded-full"
                          disabled={disabled || loading}
                          onClick={() => removeChip(item, jiraKeys, setJiraKeys)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor={confluenceInputId}>{t('fields.confluencePageIds')}</Label>
                  <Input
                    id={confluenceInputId}
                    value={confluenceDraft}
                    disabled={disabled || loading}
                    placeholder={t('placeholders.confluencePageIds')}
                    onChange={event => setConfluenceDraft(event.target.value)}
                    onKeyDown={event =>
                      handleChipKeyDown(
                        event,
                        confluenceDraft,
                        confluencePageIds,
                        setConfluencePageIds,
                        () => setConfluenceDraft(''),
                        t('messages.duplicateConfluence')
                      )
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    {confluencePageIds.map(item => (
                      <Badge key={item} variant="outline" className="h-7 gap-1 px-3">
                        <ExternalLink className="h-3 w-3" />
                        {item}
                        <button
                          type="button"
                          className="rounded-full"
                          disabled={disabled || loading}
                          onClick={() => removeChip(item, confluencePageIds, setConfluencePageIds)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    disabled={disabled || loading}
                    onClick={() => void handlePreview()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('actions.previewLoading')}
                      </>
                    ) : (
                      t('actions.preview')
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={disabled || !preview?.contextText}
                    onClick={handleConfirm}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('actions.confirm')}
                  </Button>
                </div>

                {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

                {preview ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{t('preview.sourcesTitle')}</p>
                      <div className="space-y-2">
                        {preview.sources.map(source => (
                          <div
                            key={`${source.type}-${source.id}`}
                            className="rounded-lg border bg-muted/30 px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn('border', getBadgeClasses(source))}
                              >
                                {source.status === 'SUCCESS' ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                                {source.status}
                              </Badge>
                              <span className="text-xs font-medium text-muted-foreground">
                                {getSourceTypeLabel(t, source)}
                              </span>
                              <span className="text-sm font-medium">{source.title}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {source.id}
                              {source.error ? ` • ${source.error}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Accordion type="single" collapsible defaultValue="context-preview">
                      <AccordionItem value="context-preview" className="rounded-lg border px-3">
                        <AccordionTrigger className="py-3 text-sm hover:no-underline">
                          {t('preview.contextTitle')}
                        </AccordionTrigger>
                        <AccordionContent className="pb-3">
                          <pre className="max-h-72 overflow-y-auto text-xs break-words whitespace-pre-wrap text-muted-foreground">
                            {preview.contextText}
                          </pre>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {toasts.length > 0 ? (
        <div className="pointer-events-none fixed bottom-[20%] left-1/2 z-50 flex w-[min(480px,calc(100%-48px))] -translate-x-1/2 flex-col gap-3">
          {toasts.map((toast, index) => (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto relative overflow-hidden rounded-xl border border-l-4 border-border bg-background px-4 py-3 shadow-lg transition-all ease-out',
                getToastClasses(toast.tone),
                toast.phase === 'entering' && 'translate-y-3 opacity-0 duration-[250ms]',
                toast.phase === 'visible' && 'translate-y-0 opacity-100 duration-[250ms]',
                toast.phase === 'exiting' && 'translate-y-1 opacity-0 duration-[300ms]',
                index > 0 ? 'opacity-80' : ''
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{toast.title}</p>
                  <p className="text-xs text-muted-foreground">{toast.description}</p>
                </div>
                <button
                  type="button"
                  className="rounded-full"
                  onClick={() => setToasts(prev => prev.filter(item => item.id !== toast.id))}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div
                className={cn(
                  'absolute right-0 bottom-0 left-0 h-[3px] origin-left transition-[width] duration-[3000ms] ease-linear',
                  toast.tone === 'success' && 'bg-sky-500',
                  toast.tone === 'warning' && 'bg-amber-500',
                  toast.tone === 'error' && 'bg-destructive'
                )}
                style={{ width: toast.progressStarted ? '0%' : '100%' }}
              />
            </div>
          ))}
        </div>
      ) : null}
    </>
  )
}
