import {
  AlertTriangle,
  ExternalLink,
  FileText,
  Layout,
  Link2,
  Loader2,
  Paperclip,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'

import type { Prompt } from '@/types/api'

import { StatusBadge } from '@/components/layout/StatusBadge'
import { ExternalContextChipsDisplay } from '@/components/prompt/ExternalContextChipsDisplay'
import { MediaResultDisplay } from '@/components/prompt/MediaResultDisplay'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePromptTypeLabels } from '@/hooks/usePromptType'
import { isExternalContextFile } from '@/lib/utils'
import { isMediaPromptType } from '@/types/api'

interface BatchPromptSectionProps {
  batchId: number
  prompt: Prompt
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-background p-4 shadow-sm">
      <h4 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h4>
      {children}
    </section>
  )
}

export function BatchPromptSection({ batchId, prompt }: BatchPromptSectionProps) {
  const { t } = useTranslation(['batch', 'common', 'prompt'])
  const promptTypeLabels = usePromptTypeLabels()

  const attachments = prompt.attachments ?? []
  const regularAttachments = attachments.filter(
    attachment => !isExternalContextFile(attachment.fileName)
  )
  const hasResult = Boolean(prompt.responseContent || prompt.resultMediaUrl)

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={`prompt-${prompt.id}`} className="border-none">
          <div className="flex flex-col gap-4 bg-muted/20 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={prompt.status} size="sm" />
                <Badge variant="secondary" className="text-[11px]">
                  {promptTypeLabels[prompt.promptType ?? 'TEXT']}
                </Badge>
                <Badge variant={hasResult ? 'default' : 'outline'} className="text-[11px]">
                  {hasResult
                    ? t('detail.resultAvailableYes', { ns: 'batch' })
                    : t('detail.resultAvailableNo', { ns: 'batch' })}
                </Badge>
              </div>

              <div className="min-w-0">
                <Link
                  to={`/batches/${batchId}/prompts/${prompt.id}`}
                  className="inline-flex max-w-full items-center gap-1 text-base font-semibold text-primary hover:underline"
                >
                  <span className="truncate">{prompt.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </Link>
                <p className="mt-2 line-clamp-2 text-sm whitespace-pre-wrap text-muted-foreground">
                  {prompt.userPrompt}
                </p>
              </div>
            </div>

            <AccordionTrigger className="w-full shrink-0 justify-center rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:no-underline lg:w-auto">
              {t('detail.viewDetails', { ns: 'batch' })}
            </AccordionTrigger>
          </div>

          <AccordionContent className="px-4 pt-4 pb-4">
            <div className="space-y-4">
              <SectionBlock title={t('detail.sectionInput', { ns: 'batch' })}>
                <Tabs defaultValue="text" className="flex w-full flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      {prompt.systemPrompt
                        ? t('detail.systemPromptIncluded', { ns: 'batch' })
                        : t('detail.systemPromptMissing', { ns: 'batch' })}
                    </div>
                    <TabsList variant="line" className="h-8">
                      <TabsTrigger value="markdown" className="gap-1 px-3 py-1 text-xs">
                        <Layout className="h-3 w-3" />
                        {t('detail.markdown', { ns: 'prompt' })}
                      </TabsTrigger>
                      <TabsTrigger value="text" className="gap-1 px-3 py-1 text-xs">
                        <FileText className="h-3 w-3" />
                        {t('detail.text', { ns: 'prompt' })}
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  {prompt.systemPrompt ? (
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {t('detail.systemPrompt', { ns: 'batch' })}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{prompt.systemPrompt}</p>
                    </div>
                  ) : null}
                  <div className="grid min-h-[160px] overflow-hidden rounded-lg border bg-muted/20">
                    <TabsContent value="markdown" className="col-start-1 row-start-1 mt-0 min-w-0">
                      <div className="prose prose-sm dark:prose-invert max-w-none p-4 break-words">
                        <ReactMarkdown>{prompt.userPrompt}</ReactMarkdown>
                      </div>
                    </TabsContent>
                    <TabsContent value="text" className="col-start-1 row-start-1 mt-0 min-w-0">
                      <div className="p-4 font-mono text-sm break-words whitespace-pre-wrap">
                        {prompt.userPrompt}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </SectionBlock>

              <SectionBlock title={t('detail.sectionContext', { ns: 'batch' })}>
                <div className="space-y-4">
                  <ExternalContextChipsDisplay attachments={attachments} disabled />

                  {prompt.referenceMediaUrl ? (
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <span>{t('detail.referenceMedia', { ns: 'batch' })}</span>
                      </div>
                      <a
                        href={prompt.referenceMediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm break-all text-primary hover:underline"
                      >
                        {prompt.referenceMediaUrl}
                      </a>
                    </div>
                  ) : null}

                  {regularAttachments.length > 0 ? (
                    <div className="space-y-3">
                      {regularAttachments.map((attachment, index) => (
                        <div key={`${attachment.fileName}-${index}`} className="rounded-lg border">
                          <div className="flex items-center gap-2 border-b bg-muted/20 px-3 py-2 text-sm font-medium">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <span>{attachment.fileName}</span>
                          </div>
                          <div className="max-h-[220px] overflow-y-auto p-3 font-mono text-xs break-all whitespace-pre-wrap">
                            {attachment.fileContent}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {!prompt.referenceMediaUrl &&
                  regularAttachments.length === 0 &&
                  attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('detail.noContext', { ns: 'batch' })}
                    </p>
                  ) : null}
                </div>
              </SectionBlock>

              <SectionBlock title={t('detail.sectionResult', { ns: 'batch' })}>
                {prompt.status === 'COMPLETED' ? (
                  isMediaPromptType(prompt.promptType) ? (
                    <div className="flex min-h-[260px] items-center justify-center rounded-lg border bg-background p-4">
                      <MediaResultDisplay
                        prompt={prompt}
                        imageClassName="mx-auto max-w-full"
                        videoClassName="mx-auto w-full"
                      />
                    </div>
                  ) : (
                    <Tabs defaultValue="markdown" className="flex w-full flex-col gap-3">
                      <TabsList variant="line" className="h-8 self-end">
                        <TabsTrigger value="markdown" className="gap-1 px-3 py-1 text-xs">
                          <Layout className="h-3 w-3" />
                          {t('detail.markdown', { ns: 'prompt' })}
                        </TabsTrigger>
                        <TabsTrigger value="text" className="gap-1 px-3 py-1 text-xs">
                          <FileText className="h-3 w-3" />
                          {t('detail.text', { ns: 'prompt' })}
                        </TabsTrigger>
                      </TabsList>
                      <div className="grid min-h-[180px] overflow-hidden rounded-lg border bg-background">
                        <TabsContent
                          value="markdown"
                          className="col-start-1 row-start-1 mt-0 min-w-0"
                        >
                          <div className="prose prose-sm dark:prose-invert max-w-none p-4 break-words">
                            <ReactMarkdown>
                              {prompt.responseContent || t('detail.noResponse', { ns: 'batch' })}
                            </ReactMarkdown>
                          </div>
                        </TabsContent>
                        <TabsContent value="text" className="col-start-1 row-start-1 mt-0 min-w-0">
                          <div className="p-4 font-mono text-sm break-words whitespace-pre-wrap">
                            {prompt.responseContent || t('detail.noResponse', { ns: 'batch' })}
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>
                  )
                ) : prompt.status === 'FAILED' ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                      <AlertTriangle className="h-4 w-4" />
                      {t('detail.resultFailed', { ns: 'batch' })}
                    </div>
                    <p>{t('detail.resultUnavailable', { ns: 'batch' })}</p>
                  </div>
                ) : (
                  <div className="flex min-h-[120px] flex-col items-center justify-center rounded-lg border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                    <Loader2 className="mb-3 h-6 w-6 animate-spin text-primary/50" />
                    <p>{t('detail.resultWaiting', { ns: 'batch' })}</p>
                  </div>
                )}
              </SectionBlock>

              {prompt.errorMessage ? (
                <SectionBlock title={t('detail.sectionError', { ns: 'batch' })}>
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                      <AlertTriangle className="h-4 w-4" />
                      {t('detail.errorLabel', { ns: 'batch' })}
                    </div>
                    <p className="whitespace-pre-wrap">{prompt.errorMessage}</p>
                  </div>
                </SectionBlock>
              ) : null}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}
