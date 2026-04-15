import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  Layout,
  Loader2,
  MessageSquare,
  Paperclip,
  Trash2,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { useNavigate, useParams } from 'react-router-dom'

import type { BatchStatus, Prompt } from '@/types/api'

import { ErrorAlert } from '@/components/feedback/ErrorAlert'
import { ExternalContextChipsDisplay } from '@/components/prompt/ExternalContextChipsDisplay'
import { MediaResultDisplay } from '@/components/prompt/MediaResultDisplay'
import { PromptAttachmentsField } from '@/components/prompt/PromptAttachmentsField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePromptTypeLabels } from '@/hooks/usePromptType'
import { getApiErrorMessage, showApiErrorAlert } from '@/lib/api-error'
import { batchService } from '@/services/api'
import { isMediaPromptType } from '@/types/api'

export function PromptDetailPage() {
  const { t } = useTranslation(['prompt', 'common', 'batch'])
  const { batchId, promptId } = useParams<{ batchId: string; promptId: string }>()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const promptTypeLabels = usePromptTypeLabels()

  const statusLabelMap: Record<Prompt['status'], string> = {
    DRAFT: t('status.draft', { ns: 'common' }),
    IN_PROGRESS: t('status.inProgress', { ns: 'common' }),
    COMPLETED: t('status.completed', { ns: 'common' }),
    FAILED: t('status.failed', { ns: 'common' }),
    PENDING: t('status.pending', { ns: 'common' }),
  }

  const statusAppearanceMap: Record<Prompt['status'], { color: string; icon: LucideIcon }> = {
    DRAFT: { color: 'bg-slate-500', icon: FileText },
    IN_PROGRESS: { color: 'bg-blue-500', icon: Loader2 },
    COMPLETED: { color: 'bg-green-500', icon: CheckCircle2 },
    FAILED: { color: 'bg-red-500', icon: XCircle },
    PENDING: { color: 'bg-amber-500', icon: Clock },
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!batchId || !promptId) return

      setLoading(true)
      try {
        const [promptResponse, batchResponse] = await Promise.all([
          batchService.getPrompt(Number.parseInt(batchId, 10), Number.parseInt(promptId, 10)),
          batchService.getBatch(Number.parseInt(batchId, 10)),
        ])

        if (promptResponse.success) {
          setPrompt(promptResponse.data)
          setErrorMessage(null)
        }

        if (batchResponse.success) {
          setBatchStatus(batchResponse.data.status)
        }
      } catch (error) {
        console.error('Failed to fetch prompt details:', error)
        setErrorMessage(getApiErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [batchId, promptId])

  const handleDelete = async () => {
    if (!batchId || !promptId) return

    setIsDeleting(true)
    try {
      await batchService.deletePrompt(Number.parseInt(batchId, 10), Number.parseInt(promptId, 10))
      setErrorMessage(null)
      navigate(`/batches/${batchId}`)
    } catch (error) {
      console.error('Failed to delete prompt:', error)
      showApiErrorAlert(error)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (loading && !prompt) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!prompt) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">{t('detail.notFound', { ns: 'prompt' })}</p>
        <Button variant="link" onClick={() => navigate(`/batches/${batchId}`)}>
          {t('detail.backToBatch', { ns: 'prompt' })}
        </Button>
      </div>
    )
  }

  const currentStatusAppearance =
    batchStatus === 'DRAFT' ? statusAppearanceMap.DRAFT : statusAppearanceMap[prompt.status]
  const StatusIcon = currentStatusAppearance.icon

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/batches/${batchId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{prompt.label}</h1>
            <Badge
              variant={batchStatus === 'DRAFT' ? 'outline' : 'default'}
              className={`${
                batchStatus === 'DRAFT' ? '' : currentStatusAppearance.color
              } flex h-6 items-center px-2 py-0.5 text-[10px] font-medium ${
                batchStatus === 'DRAFT' ? '' : 'text-white'
              }`}
            >
              <StatusIcon
                className={`mr-1.5 h-3 w-3 ${prompt.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`}
              />
              {batchStatus === 'DRAFT'
                ? t('detail.draftBadge', { ns: 'batch' })
                : statusLabelMap[prompt.status]}
            </Badge>
            {prompt.promptType && prompt.promptType !== 'TEXT' ? (
              <Badge variant="secondary" className="h-6 px-2 py-0.5 text-[10px] font-medium">
                {promptTypeLabels[prompt.promptType]}
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground">{t('detail.subtitle', { ns: 'prompt' })}</p>
        </div>

        {batchStatus === 'DRAFT' && prompt.status === 'PENDING' ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate(`/batches/${batchId}/prompts/${promptId}/edit`)}
            >
              <Edit className="h-4 w-4" />
              {t('actions.edit', { ns: 'common' })}
            </Button>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('actions.delete', { ns: 'common' })}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('detail.deleteTitle', { ns: 'prompt' })}</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-muted-foreground">
                  {t('detail.deleteDescription', { ns: 'prompt' })}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={isDeleting}
                  >
                    {t('actions.cancel', { ns: 'common' })}
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('actions.delete', { ns: 'common' })}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6">
        <Tabs defaultValue="text" className="flex w-full flex-col gap-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">
                  {t('detail.userPrompt', { ns: 'prompt' })}
                </CardTitle>
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
            </CardHeader>
            <CardContent>
              <div className="grid min-h-[200px] min-w-0 overflow-hidden rounded-md border bg-muted/50">
                <TabsContent value="markdown" className="col-start-1 row-start-1 mt-0 min-w-0">
                  <div className="prose prose-sm dark:prose-invert h-full max-w-none p-6 break-words">
                    <ReactMarkdown>{prompt.userPrompt}</ReactMarkdown>
                  </div>
                </TabsContent>
                <TabsContent value="text" className="col-start-1 row-start-1 mt-0 min-w-0">
                  <div className="h-full p-6 font-mono text-sm break-words whitespace-pre-wrap">
                    {prompt.userPrompt}
                  </div>
                </TabsContent>
              </div>
            </CardContent>
          </Card>
        </Tabs>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{t('detail.attachments', { ns: 'prompt' })}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ExternalContextChipsDisplay attachments={prompt.attachments ?? []} disabled />
            <PromptAttachmentsField
              attachments={prompt.attachments ?? []}
              disabled
              helperText={t('detail.attachmentsHelper', { ns: 'prompt' })}
              onChange={() => undefined}
            />
          </CardContent>
        </Card>

        <Card>
          {prompt.status === 'COMPLETED' ? (
            isMediaPromptType(prompt.promptType) ? (
              <>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">
                      {t('detail.modelAnswer', { ns: 'prompt' })}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex min-h-[300px] items-center justify-center rounded-md border bg-background p-6 shadow-sm">
                    <MediaResultDisplay
                      prompt={prompt}
                      imageClassName="max-h-[600px]"
                      videoClassName="max-h-[600px] w-full"
                    />
                  </div>
                </CardContent>
              </>
            ) : (
              <Tabs defaultValue="text" className="flex w-full flex-col gap-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">
                      {t('detail.modelAnswer', { ns: 'prompt' })}
                    </CardTitle>
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
                </CardHeader>
                <CardContent>
                  <div className="grid min-h-[200px] min-w-0 overflow-hidden rounded-md border bg-background shadow-sm">
                    <TabsContent value="markdown" className="col-start-1 row-start-1 mt-0 min-w-0">
                      <div className="prose prose-sm dark:prose-invert h-full max-w-none p-6 break-words">
                        <ReactMarkdown>{prompt.responseContent || ''}</ReactMarkdown>
                      </div>
                    </TabsContent>
                    <TabsContent value="text" className="col-start-1 row-start-1 mt-0 min-w-0">
                      <div className="h-full p-6 font-mono text-sm break-words whitespace-pre-wrap">
                        {prompt.responseContent || t('detail.noResponseContent', { ns: 'prompt' })}
                      </div>
                    </TabsContent>
                  </div>
                </CardContent>
              </Tabs>
            )
          ) : prompt.status === 'FAILED' ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-lg text-destructive">
                    {t('detail.errorTitle', { ns: 'batch' })}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive shadow-sm">
                    <div className="mb-2 flex items-center gap-2 font-bold">
                      <AlertTriangle className="h-4 w-4" />
                      {t('detail.errorLabel', { ns: 'batch' })}
                    </div>
                    <div className="whitespace-pre-wrap opacity-90">
                      {prompt.errorMessage || t('detail.unknownError', { ns: 'batch' })}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <p className="text-xs text-muted-foreground">
                      {t('detail.failedHelper', { ns: 'prompt' })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    {t('detail.modelAnswer', { ns: 'prompt' })}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="mb-2 h-10 w-10 animate-spin opacity-20" />
                  <p>
                    {t('detail.waitingResponse', {
                      ns: 'prompt',
                      status: statusLabelMap[prompt.status],
                    })}
                  </p>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <div className="flex justify-center pt-4">
        <Button variant="outline" onClick={() => navigate(`/batches/${batchId}`)}>
          {t('detail.backToBatch', { ns: 'prompt' })}
        </Button>
      </div>
    </div>
  )
}
