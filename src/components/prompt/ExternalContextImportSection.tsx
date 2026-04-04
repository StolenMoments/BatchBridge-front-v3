import { FileCode2, Loader2, Plus, Trash2, Ticket } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  ExternalContextPreviewResponse,
  ExternalContextSourceType,
  GithubPreviewRequest,
} from '@/types/api'

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
import { getApiErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import { externalContextService } from '@/services/api'

interface ExternalContextSource {
  id: number
  type?: ExternalContextSourceType
  owner: string
  repo: string
  path: string
  ref: string
  issueKey: string
  loading: boolean
  selected: boolean
  preview?: ExternalContextPreviewResponse
  errorMessage?: string
}

interface ExternalContextImportSectionProps {
  disabled?: boolean
  userPrompt: string
  onUserPromptChange: (nextPrompt: string) => void
}

const createSource = (id: number): ExternalContextSource => ({
  id,
  owner: '',
  repo: '',
  path: '',
  ref: '',
  issueKey: '',
  loading: false,
  selected: false,
})

function buildContextBlock(preview: ExternalContextPreviewResponse): string {
  return [`[Context] ${preview.label}`, preview.content].join('\n')
}

export function ExternalContextImportSection({
  disabled = false,
  userPrompt,
  onUserPromptChange,
}: ExternalContextImportSectionProps) {
  const { t } = useTranslation('external_context')
  const [sources, setSources] = useState<ExternalContextSource[]>([createSource(1)])
  const [nextSourceId, setNextSourceId] = useState(2)

  const patchSource = (sourceId: number, patch: Partial<ExternalContextSource>) => {
    setSources(prev =>
      prev.map(source => (source.id === sourceId ? { ...source, ...patch } : source))
    )
  }

  const addSource = () => {
    setSources(prev => [...prev, createSource(nextSourceId)])
    setNextSourceId(prev => prev + 1)
  }

  const removeSource = (sourceId: number) => {
    setSources(prev =>
      prev.length === 1 ? [createSource(sourceId)] : prev.filter(source => source.id !== sourceId)
    )
  }

  const validateGithubSource = (source: ExternalContextSource): string | null => {
    if (!source.type) return t('errors.sourceTypeRequired')
    if (!source.owner.trim()) return t('errors.ownerRequired')
    if (!source.repo.trim()) return t('errors.repoRequired')
    if (!source.path.trim()) return t('errors.pathRequired')
    return null
  }

  const validateJiraSource = (source: ExternalContextSource): string | null => {
    if (!source.type) return t('errors.sourceTypeRequired')
    if (!source.issueKey.trim()) return t('errors.issueKeyRequired')
    return null
  }

  const handlePreview = async (source: ExternalContextSource) => {
    const validationMessage =
      source.type === 'github' ? validateGithubSource(source) : validateJiraSource(source)

    if (validationMessage) {
      patchSource(source.id, {
        errorMessage: validationMessage,
        preview: undefined,
        selected: false,
      })
      return
    }

    patchSource(source.id, { loading: true, errorMessage: undefined })

    try {
      const response =
        source.type === 'github'
          ? await externalContextService.previewGithub({
              owner: source.owner.trim(),
              repo: source.repo.trim(),
              path: source.path.trim(),
              ref: source.ref.trim() || undefined,
            } satisfies GithubPreviewRequest)
          : await externalContextService.previewJira({
              issueKey: source.issueKey.trim(),
            })

      if (response.success) {
        patchSource(source.id, {
          loading: false,
          errorMessage: undefined,
          preview: response.data,
          selected: true,
        })
      }
    } catch (error) {
      patchSource(source.id, {
        loading: false,
        errorMessage: getApiErrorMessage(error),
        preview: undefined,
        selected: false,
      })
    }
  }

  const handleImportSelected = () => {
    const selectedSources = sources.filter(source => source.selected)
    const successfulSources = selectedSources.filter(source => source.preview)
    const failedCount = selectedSources.length - successfulSources.length

    if (successfulSources.length === 0) {
      window.alert(`${t('messages.failedTitle')}\n${t('messages.failedDescription')}`)
      return
    }

    const contextText = successfulSources
      .map(source => buildContextBlock(source.preview as ExternalContextPreviewResponse))
      .join('\n\n')

    const nextPrompt = userPrompt.trim() ? `${userPrompt.trim()}\n\n${contextText}` : contextText
    onUserPromptChange(nextPrompt)

    if (failedCount > 0) {
      window.alert(
        `${t('messages.partialTitle')}\n${t('messages.partialDescription', {
          successCount: successfulSources.length,
          failedCount,
        })}`
      )
    } else {
      window.alert(
        `${t('messages.successTitle')}\n${t('messages.successDescription', {
          count: successfulSources.length,
        })}`
      )
    }

    setSources(prev =>
      prev.map(source =>
        source.selected && source.preview
          ? {
              ...source,
              selected: false,
              preview: undefined,
              errorMessage: undefined,
            }
          : source
      )
    )
  }

  return (
    <Card className="border-dashed bg-muted/20">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sources.map((source, index) => {
          const hasPreview = Boolean(source.preview)

          return (
            <div key={source.id} className="rounded-xl border bg-background/80 p-4 shadow-xs">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg border',
                      source.type === 'jira'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    )}
                  >
                    {source.type === 'jira' ? (
                      <Ticket className="h-4 w-4" />
                    ) : (
                      <FileCode2 className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{t('sourceLabel', { index: index + 1 })}</p>
                    <p className="text-xs text-muted-foreground">
                      {source.preview?.label || t('preview.empty')}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled || source.loading}
                  onClick={() => removeSource(source.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`context-type-${source.id}`}>{t('sourceType')}</Label>
                  <Select
                    value={source.type}
                    onValueChange={value =>
                      patchSource(source.id, {
                        type: value as ExternalContextSourceType,
                        preview: undefined,
                        errorMessage: undefined,
                        selected: false,
                      })
                    }
                  >
                    <SelectTrigger id={`context-type-${source.id}`}>
                      <SelectValue placeholder={t('sourceTypePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="github">{t('sourceTypes.github')}</SelectItem>
                      <SelectItem value="jira">{t('sourceTypes.jira')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {source.type === 'github' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`context-owner-${source.id}`}>{t('fields.owner')}</Label>
                      <Input
                        id={`context-owner-${source.id}`}
                        placeholder={t('placeholders.owner')}
                        value={source.owner}
                        disabled={disabled || source.loading}
                        onChange={event =>
                          patchSource(source.id, {
                            owner: event.target.value,
                            preview: undefined,
                            errorMessage: undefined,
                            selected: false,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`context-repo-${source.id}`}>{t('fields.repo')}</Label>
                      <Input
                        id={`context-repo-${source.id}`}
                        placeholder={t('placeholders.repo')}
                        value={source.repo}
                        disabled={disabled || source.loading}
                        onChange={event =>
                          patchSource(source.id, {
                            repo: event.target.value,
                            preview: undefined,
                            errorMessage: undefined,
                            selected: false,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`context-path-${source.id}`}>{t('fields.path')}</Label>
                      <Input
                        id={`context-path-${source.id}`}
                        placeholder={t('placeholders.path')}
                        value={source.path}
                        disabled={disabled || source.loading}
                        onChange={event =>
                          patchSource(source.id, {
                            path: event.target.value,
                            preview: undefined,
                            errorMessage: undefined,
                            selected: false,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`context-ref-${source.id}`}>{t('fields.ref')}</Label>
                      <Input
                        id={`context-ref-${source.id}`}
                        placeholder={t('placeholders.ref')}
                        value={source.ref}
                        disabled={disabled || source.loading}
                        onChange={event =>
                          patchSource(source.id, {
                            ref: event.target.value,
                            preview: undefined,
                            errorMessage: undefined,
                            selected: false,
                          })
                        }
                      />
                    </div>
                  </>
                ) : source.type === 'jira' ? (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`context-jira-${source.id}`}>{t('fields.issueKey')}</Label>
                    <Input
                      id={`context-jira-${source.id}`}
                      placeholder={t('placeholders.issueKey')}
                      value={source.issueKey}
                      disabled={disabled || source.loading}
                      onChange={event =>
                        patchSource(source.id, {
                          issueKey: event.target.value,
                          preview: undefined,
                          errorMessage: undefined,
                          selected: false,
                        })
                      }
                    />
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled || source.loading || !source.type}
                  onClick={() => void handlePreview(source)}
                >
                  {source.loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('preview.loading')}
                    </>
                  ) : (
                    t('actions.preview')
                  )}
                </Button>

                {hasPreview ? (
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={source.selected}
                      disabled={disabled || source.loading}
                      onChange={event => patchSource(source.id, { selected: event.target.checked })}
                    />
                    {t('preview.select')}
                  </label>
                ) : null}
              </div>

              <div className="mt-4 rounded-lg border bg-muted/40 p-3">
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {t('preview.title')}
                </p>
                {source.errorMessage ? (
                  <p className="text-sm text-destructive">{source.errorMessage}</p>
                ) : source.preview ? (
                  <div className="space-y-2">
                    <p className="font-medium">{source.preview.label}</p>
                    <pre className="max-h-56 overflow-y-auto text-xs break-words whitespace-pre-wrap text-muted-foreground">
                      {source.preview.content}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('preview.empty')}</p>
                )}
              </div>
            </div>
          )
        })}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" disabled={disabled} onClick={addSource}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.addSource')}
          </Button>

          <p className="text-sm text-muted-foreground">{t('helper.importDescription')}</p>
        </div>

        <Button type="button" className="w-full" disabled={disabled} onClick={handleImportSelected}>
          {t('actions.importSelected')}
        </Button>
      </CardContent>
    </Card>
  )
}
