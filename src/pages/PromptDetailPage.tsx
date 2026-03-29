import {
  ArrowLeft,
  Bot,
  Edit,
  FileText,
  Layout,
  Loader2,
  MessageSquare,
  Paperclip,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { useNavigate, useParams } from 'react-router-dom'

import type { Attachment, Prompt } from '@/types/api'

import { PromptAttachmentsField } from '@/components/prompt/PromptAttachmentsField'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { batchService } from '@/services/api'

export function PromptDetailPage() {
  const { t } = useTranslation(['prompt', 'common'])
  const { batchId, promptId } = useParams<{ batchId: string; promptId: string }>()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editLabel, setEditLabel] = useState('')
  const [editUserPrompt, setEditUserPrompt] = useState('')
  const [editAttachments, setEditAttachments] = useState<Attachment[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [isAttachmentPending, setIsAttachmentPending] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const statusLabelMap: Record<Prompt['status'], string> = {
    DRAFT: t('status.draft', { ns: 'common' }),
    IN_PROGRESS: t('status.inProgress', { ns: 'common' }),
    COMPLETED: t('status.completed', { ns: 'common' }),
    FAILED: t('status.failed', { ns: 'common' }),
    PENDING: t('status.pending', { ns: 'common' }),
  }

  const haveAttachmentsChanged = (current: Attachment[], next: Attachment[]) => {
    if (current.length !== next.length) return true

    return current.some((attachment, index) => {
      const nextAttachment = next[index]
      return (
        attachment.fileName !== nextAttachment?.fileName ||
        attachment.fileContent !== nextAttachment?.fileContent
      )
    })
  }

  useEffect(() => {
    const fetchPrompt = async () => {
      if (!batchId || !promptId) return

      setLoading(true)
      try {
        const response = await batchService.getPrompt(
          Number.parseInt(batchId, 10),
          Number.parseInt(promptId, 10)
        )
        if (response.success) {
          setPrompt(response.data)
          setEditLabel(response.data.label || '')
          setEditUserPrompt(response.data.userPrompt || '')
          setEditAttachments(response.data.attachments ?? [])
        }
      } catch (error) {
        console.error('Failed to fetch prompt:', error)
      } finally {
        setLoading(false)
      }
    }

    void fetchPrompt()
  }, [batchId, promptId])

  const resetEditState = (nextPrompt: Prompt) => {
    setEditLabel(nextPrompt.label || '')
    setEditUserPrompt(nextPrompt.userPrompt || '')
    setEditAttachments(nextPrompt.attachments ?? [])
    setAttachmentError(null)
    setIsAttachmentPending(false)
  }

  const handleEditDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open)
    if (open && prompt) {
      resetEditState(prompt)
    }
  }

  const handleUpdate = async () => {
    if (!batchId || !promptId || !prompt || isAttachmentPending) return

    setIsUpdating(true)
    try {
      const batchIdNumber = Number.parseInt(batchId, 10)
      const promptIdNumber = Number.parseInt(promptId, 10)
      const attachmentsChanged = haveAttachmentsChanged(prompt.attachments ?? [], editAttachments)

      if (attachmentsChanged) {
        const createResponse = await batchService.addPrompt(batchIdNumber, {
          label: editLabel,
          systemPrompt: prompt.systemPrompt,
          userPrompt: editUserPrompt,
          attachments: editAttachments,
        })

        if (createResponse.success) {
          await batchService.deletePrompt(batchIdNumber, promptIdNumber)
          setPrompt(createResponse.data)
          resetEditState(createResponse.data)
          setIsEditDialogOpen(false)
          navigate(`/batches/${batchId}/prompts/${createResponse.data.id}`, { replace: true })
        }
        return
      }

      const updateResponse = await batchService.updatePrompt(batchIdNumber, promptIdNumber, {
        label: editLabel,
        userPrompt: editUserPrompt,
        attachments: editAttachments,
      })

      if (updateResponse.success) {
        setPrompt(updateResponse.data)
        resetEditState(updateResponse.data)
        setIsEditDialogOpen(false)
      }
    } catch (error) {
      console.error('Failed to update prompt:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!batchId || !promptId) return

    setIsDeleting(true)
    try {
      await batchService.deletePrompt(Number.parseInt(batchId, 10), Number.parseInt(promptId, 10))
      navigate(`/batches/${batchId}`)
    } catch (error) {
      console.error('Failed to delete prompt:', error)
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/batches/${batchId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{prompt.label}</h1>
          <p className="text-muted-foreground">{t('detail.subtitle', { ns: 'prompt' })}</p>
        </div>

        {prompt.status === 'PENDING' ? (
          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogChange}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  {t('actions.edit', { ns: 'common' })}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-150">
                <DialogHeader>
                  <DialogTitle>{t('detail.editTitle', { ns: 'prompt' })}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="label">{t('detail.label', { ns: 'prompt' })}</Label>
                    <Input
                      id="label"
                      value={editLabel}
                      onChange={event => setEditLabel(event.target.value)}
                      placeholder={t('detail.labelPlaceholder', { ns: 'prompt' })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="userPrompt">{t('detail.userPrompt', { ns: 'prompt' })}</Label>
                    <Textarea
                      id="userPrompt"
                      value={editUserPrompt}
                      onChange={event => setEditUserPrompt(event.target.value)}
                      placeholder={t('detail.userPromptPlaceholder', { ns: 'prompt' })}
                      rows={10}
                    />
                  </div>
                  <PromptAttachmentsField
                    attachments={editAttachments}
                    errorMessage={attachmentError}
                    onChange={setEditAttachments}
                    onErrorChange={setAttachmentError}
                    onPendingChange={setIsAttachmentPending}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={isUpdating || isAttachmentPending}
                  >
                    {t('actions.cancel', { ns: 'common' })}
                  </Button>
                  <Button onClick={handleUpdate} disabled={isUpdating || isAttachmentPending}>
                    {isUpdating || isAttachmentPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {t('actions.save', { ns: 'common' })}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
          <CardContent>
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
