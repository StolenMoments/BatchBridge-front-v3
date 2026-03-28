import { format } from 'date-fns'
import {
  ArrowLeft,
  RefreshCw,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Cpu,
  Clock,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  FileText,
  Paperclip,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useParams, Link, useNavigate } from 'react-router-dom'

import type { Attachment, Batch, BatchStatus } from '@/types/api'

import { PromptAttachmentsField } from '@/components/prompt/PromptAttachmentsField'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import { batchService } from '@/services/api'

const statusMap: Record<BatchStatus, { label: string; color: string; icon: LucideIcon }> = {
  DRAFT: { label: '초안', color: 'bg-slate-500', icon: FileText },
  IN_PROGRESS: { label: '처리중', color: 'bg-blue-500', icon: Loader2 },
  COMPLETED: { label: '완료', color: 'bg-green-500', icon: CheckCircle2 },
  FAILED: { label: '실패', color: 'bg-red-500', icon: XCircle },
}

export function BatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [batch, setBatch] = useState<Batch | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [resyncing, setResyncing] = useState(false)

  // New Prompt Form (for DRAFT status)
  const [newPrompt, setNewPrompt] = useState({
    label: '',
    systemPrompt: '',
    userPrompt: '',
    attachments: [] as Attachment[],
  })
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [isAttachmentPending, setIsAttachmentPending] = useState(false)

  const fetchBatch = useCallback(
    async (showLoading = true) => {
      if (!id) return
      if (showLoading) setLoading(true)
      try {
        const response = await batchService.getBatch(Number.parseInt(id))
        if (response.success) {
          // Ensure the batch state is actually updated with fresh data
          setBatch({ ...response.data })
        }
      } catch (error) {
        console.error('Failed to fetch batch:', error)
      } finally {
        if (showLoading) setLoading(false)
      }
    },
    [id]
  )

  useEffect(() => {
    fetchBatch()
  }, [fetchBatch])

  const handleSubmitBatch = async () => {
    if (!batch) return
    setSubmitting(true)
    try {
      const response = await batchService.submitBatch(batch.id)
      if (response.success) {
        navigate('/batches')
      }
    } catch (error) {
      console.error('Failed to submit batch:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSyncBatch = async () => {
    if (!batch) return
    setSyncing(true)
    try {
      const response = await batchService.syncBatch(batch.id)
      if (response.success) {
        setBatch(response.data)
      }
    } catch (error) {
      console.error('Failed to sync batch:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleResyncPrompts = async () => {
    if (!batch) return
    setResyncing(true)
    try {
      const response = await batchService.syncPrompts(batch.id)
      if (response.success) {
        const { resynced, stillFailed } = response.data

        // UI Feedback (Using alert since Toast is not implemented in this project)
        if (resynced > 0) {
          alert(`${resynced}개 프롬프트가 복구되었습니다.`)
        }
        if (stillFailed > 0) {
          alert(`${stillFailed}개 프롬프트는 여전히 실패 상태입니다.`)
        }
        if (resynced === 0 && stillFailed === 0) {
          alert('재동기화할 프롬프트가 없습니다.')
        }

        // Refresh batch details
        fetchBatch(false)
      }
    } catch (error) {
      console.error('Failed to resync prompts:', error)
      alert('프롬프트 재동기화 중 오류가 발생했습니다.')
    } finally {
      setResyncing(false)
    }
  }

  const handleAddPrompt = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!batch || !newPrompt.userPrompt || isAttachmentPending) return

    try {
      const response = await batchService.addPrompt(batch.id, {
        label: newPrompt.label || undefined,
        systemPrompt: newPrompt.systemPrompt || undefined,
        userPrompt: newPrompt.userPrompt,
        attachments: newPrompt.attachments,
      })

      if (response.success) {
        setNewPrompt({ label: '', systemPrompt: '', userPrompt: '', attachments: [] })
        setAttachmentError(null)
        // Update local state directly to ensure immediate UI update
        if (response.data) {
          setBatch(prev => {
            if (!prev) return prev
            return {
              ...prev,
              prompts: [...(prev.prompts || []), response.data],
            }
          })
        }
        fetchBatch(false)
      }
    } catch (error) {
      console.error('Failed to add prompt:', error)
    }
  }

  const handleDeletePrompt = async (promptId: number) => {
    if (!batch || !confirm('프롬프트를 삭제하시겠습니까?')) return

    try {
      await batchService.deletePrompt(batch.id, promptId)
      // Optimistic update
      setBatch(prev => {
        if (!prev) return prev
        return {
          ...prev,
          prompts: prev.prompts?.filter(p => p.id !== promptId) || [],
        }
      })
      // Also refetch from server to ensure sync
      fetchBatch(false)
    } catch (error) {
      console.error('Failed to delete prompt:', error)
    }
  }

  if (loading && !batch) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">배치를 찾을 수 없습니다.</p>
        <Button variant="link" onClick={() => navigate('/batches')}>
          목록으로 돌아가기
        </Button>
      </div>
    )
  }

  const status = statusMap[batch.status]
  const StatusIcon = status.icon

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/batches')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{batch.label}</h1>
          </div>
          <div className="ml-11 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Cpu className="h-4 w-4" /> {batch.model}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> 생성:{' '}
              {format(new Date(batch.createdAt), 'yyyy-MM-dd HH:mm')}
            </div>
            {batch.submittedAt && (
              <div className="flex items-center gap-1">
                <Send className="h-4 w-4" /> 제출:{' '}
                {format(new Date(batch.submittedAt), 'yyyy-MM-dd HH:mm')}
              </div>
            )}
            {batch.completedAt && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> 완료:{' '}
                {format(new Date(batch.completedAt), 'yyyy-MM-dd HH:mm')}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 md:mt-1">
          {batch.status === 'COMPLETED' &&
            batch.prompts?.some(p => p.status === 'PENDING' || p.status === 'FAILED') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResyncPrompts}
                disabled={resyncing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${resyncing ? 'animate-spin' : ''}`} />
                프롬프트 재동기화
              </Button>
            )}
          <Badge
            className={`${status.color} flex h-8 items-center px-3 py-1.5 text-sm font-medium text-white`}
          >
            <StatusIcon
              className={`mr-2 h-4 w-4 ${batch.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`}
            />
            {status.label}
          </Badge>
          {batch.status === 'IN_PROGRESS' && (
            <Button variant="outline" size="sm" onClick={handleSyncBatch} disabled={syncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              상태 업데이트
            </Button>
          )}
          {batch.status === 'DRAFT' && (
            <Button size="sm" onClick={handleSubmitBatch} disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              배치 제출하기
            </Button>
          )}
        </div>
      </div>

      {batch.errorMessage && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" /> 오류 발생
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 dark:text-red-300">{batch.errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Prompts Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <MessageSquare className="h-5 w-5" /> 프롬프트 목록 ({batch.prompts?.length || 0})
          </h2>
        </div>

        {batch.status === 'DRAFT' ? (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Prompt List (Left) */}
            <div className="space-y-4 lg:col-span-7">
              {batch.prompts?.map((prompt, index) => (
                <Card key={prompt.id} className="transition-colors hover:border-primary/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
                    <CardTitle className="text-base">
                      <Link
                        to={`/batches/${batch.id}/prompts/${prompt.id}`}
                        className="flex items-center gap-1 font-semibold text-primary hover:underline dark:text-primary-foreground"
                      >
                        {index + 1}. {prompt.label} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      DRAFT
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 px-4 py-2">
                    {prompt.systemPrompt && (
                      <div className="rounded border bg-muted p-2 text-xs">
                        <span className="mb-1 block font-semibold text-foreground">
                          System Prompt:
                        </span>
                        <p className="line-clamp-2 text-muted-foreground">{prompt.systemPrompt}</p>
                      </div>
                    )}
                    <div className="text-sm">
                      <p className="line-clamp-3 whitespace-pre-wrap">{prompt.userPrompt}</p>
                    </div>
                    {(prompt.attachments?.length ?? 0) > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="h-3.5 w-3.5" />
                        첨부 파일 {prompt.attachments?.length}개
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end px-4 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeletePrompt(prompt.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {batch.prompts?.length === 0 && (
                <div className="rounded-lg border border-dashed py-10 text-center">
                  <p className="text-muted-foreground">추가된 프롬프트가 없습니다.</p>
                </div>
              )}
            </div>

            {/* Add Prompt Form (Right) */}
            <div className="lg:col-span-5">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="text-lg">프롬프트 추가</CardTitle>
                  <CardDescription>배치에 새로운 프롬프트를 추가합니다.</CardDescription>
                </CardHeader>
                <form onSubmit={handleAddPrompt}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="p-label" className="text-sm font-medium text-foreground">
                        라벨 (선택)
                      </Label>
                      <Input
                        id="p-label"
                        placeholder="프롬프트 구분용 라벨"
                        value={newPrompt.label}
                        onChange={e => setNewPrompt({ ...newPrompt, label: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="p-system" className="text-sm font-medium text-foreground">
                        System Prompt (선택)
                      </Label>
                      <Textarea
                        id="p-system"
                        placeholder="System Prompt"
                        className="min-h-[80px] text-sm"
                        value={newPrompt.systemPrompt}
                        onChange={e => setNewPrompt({ ...newPrompt, systemPrompt: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="p-user" className="text-sm font-medium text-foreground">
                        User Prompt (필수)
                      </Label>
                      <Textarea
                        id="p-user"
                        placeholder="User Prompt"
                        required
                        className="min-h-[150px] text-sm"
                        value={newPrompt.userPrompt}
                        onChange={e => setNewPrompt({ ...newPrompt, userPrompt: e.target.value })}
                      />
                    </div>
                    <PromptAttachmentsField
                      attachments={newPrompt.attachments}
                      errorMessage={attachmentError}
                      onChange={attachments => setNewPrompt({ ...newPrompt, attachments })}
                      onErrorChange={setAttachmentError}
                      onPendingChange={setIsAttachmentPending}
                    />
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!newPrompt.userPrompt || isAttachmentPending}
                    >
                      <Plus className="mr-2 h-4 w-4" /> 프롬프트 추가
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </div>
        ) : (
          /* Non-DRAFT Status Prompt List */
          <div className="space-y-4">
            {batch.prompts?.map(prompt => (
              <Card
                key={prompt.id}
                className="overflow-hidden transition-colors hover:border-primary/50"
              >
                <CardHeader className="flex flex-row items-center justify-between bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/batches/${batch.id}/prompts/${prompt.id}`}
                      className="flex items-center gap-1 text-lg font-bold text-primary hover:underline dark:text-primary-foreground"
                    >
                      {prompt.label} <ExternalLink className="h-3 w-3" />
                    </Link>
                    <Badge
                      variant={prompt.status === 'COMPLETED' ? 'default' : 'secondary'}
                      className="h-5 text-[10px]"
                    >
                      {prompt.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion type="multiple" defaultValue={['input', 'output']} className="w-full">
                    <AccordionItem value="input" className="border-none">
                      <AccordionTrigger className="px-4 py-2 text-xs tracking-wider text-muted-foreground uppercase hover:no-underline">
                        입력 내용 (User Prompt)
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="max-h-[200px] overflow-y-auto rounded-md border bg-muted/50 p-4 text-sm whitespace-pre-wrap">
                          {prompt.userPrompt}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {(prompt.attachments?.length ?? 0) > 0 && (
                      <AccordionItem value="attachments" className="border-none">
                        <AccordionTrigger className="px-4 py-2 text-xs tracking-wider text-muted-foreground uppercase hover:no-underline">
                          첨부 파일 ({prompt.attachments?.length})
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-3">
                            {prompt.attachments?.map((attachment, index) => (
                              <div
                                key={`${attachment.fileName}-${index}`}
                                className="rounded-md border bg-muted/30 p-3"
                              >
                                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                                  {attachment.fileName}
                                </div>
                                <div className="max-h-[200px] overflow-y-auto rounded-md border bg-background p-3 font-mono text-xs break-all whitespace-pre-wrap">
                                  {attachment.fileContent}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {prompt.status === 'COMPLETED' && prompt.responseContent && (
                      <AccordionItem value="output" className="border-none">
                        <AccordionTrigger className="px-4 py-2 text-xs font-semibold tracking-wider text-green-600 uppercase hover:no-underline dark:text-green-400">
                          모델 응답 (Answer)
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="prose prose-sm dark:prose-invert max-h-[400px] max-w-none overflow-y-auto rounded-md border bg-background p-4 shadow-sm">
                            <ReactMarkdown>{prompt.responseContent}</ReactMarkdown>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {prompt.errorMessage && (
                      <div className="px-4 pb-4">
                        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                          <span className="mb-1 block font-bold">에러:</span>
                          {prompt.errorMessage}
                        </div>
                      </div>
                    )}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center pt-8">
        <Button variant="outline" onClick={() => navigate('/batches')}>
          목록으로 돌아가기
        </Button>
      </div>
    </div>
  )
}
