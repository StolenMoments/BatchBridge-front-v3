import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Bot,
  Edit,
  Trash2,
  FileText,
  Layout,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useParams, useNavigate } from 'react-router-dom'

import type { Prompt } from '@/types/api'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { batchService } from '@/services/api'

export function PromptDetailPage() {
  const { batchId, promptId } = useParams<{ batchId: string; promptId: string }>()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editLabel, setEditLabel] = useState('')
  const [editUserPrompt, setEditUserPrompt] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchPrompt = async () => {
      if (!batchId || !promptId) return
      setLoading(true)
      try {
        const response = await batchService.getPrompt(
          Number.parseInt(batchId),
          Number.parseInt(promptId)
        )
        if (response.success) {
          setPrompt(response.data)
          setEditLabel(response.data.label || '')
          setEditUserPrompt(response.data.userPrompt || '')
        }
      } catch (error) {
        console.error('Failed to fetch prompt:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPrompt()
  }, [batchId, promptId])

  const handleUpdate = async () => {
    if (!batchId || !promptId || !prompt) return
    setIsUpdating(true)
    try {
      const response = await batchService.updatePrompt(
        Number.parseInt(batchId),
        Number.parseInt(promptId),
        {
          label: editLabel,
          userPrompt: editUserPrompt,
        }
      )
      if (response.success) {
        setPrompt(response.data)
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
      await batchService.deletePrompt(Number.parseInt(batchId), Number.parseInt(promptId))
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
        <p className="text-muted-foreground">프롬프트를 찾을 수 없습니다.</p>
        <Button variant="link" onClick={() => navigate(`/batches/${batchId}`)}>
          배치로 돌아가기
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
          <p className="text-muted-foreground">프롬프트 상세 내용</p>
        </div>
        {prompt.status === 'PENDING' && (
          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  수정
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-150">
                <DialogHeader>
                  <DialogTitle>프롬프트 수정</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="label">라벨</Label>
                    <Input
                      id="label"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      placeholder="프롬프트 라벨을 입력하세요"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="userPrompt">User Prompt</Label>
                    <Textarea
                      id="userPrompt"
                      value={editUserPrompt}
                      onChange={e => setEditUserPrompt(e.target.value)}
                      placeholder="프롬프트 내용을 입력하세요"
                      rows={10}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={isUpdating}
                  >
                    취소
                  </Button>
                  <Button onClick={handleUpdate} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    저장
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
                  삭제
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>프롬프트 삭제</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-muted-foreground">
                  정말로 이 프롬프트를 삭제하시겠습니까? 삭제된 프롬프트는 복구할 수 없습니다.
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={isDeleting}
                  >
                    취소
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    삭제
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        <Tabs defaultValue="text" className="flex w-full flex-col gap-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">User Prompt</CardTitle>
              </div>
              <TabsList variant="line" className="h-8">
                <TabsTrigger value="markdown" className="gap-1 px-3 py-1 text-xs">
                  <Layout className="h-3 w-3" />
                  Markdown
                </TabsTrigger>
                <TabsTrigger value="text" className="gap-1 px-3 py-1 text-xs">
                  <FileText className="h-3 w-3" />
                  Text
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
          {prompt.status === 'COMPLETED' ? (
            <Tabs defaultValue="text" className="flex w-full flex-col gap-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Model Answer</CardTitle>
                </div>
                <TabsList variant="line" className="h-8">
                  <TabsTrigger value="markdown" className="gap-1 px-3 py-1 text-xs">
                    <Layout className="h-3 w-3" />
                    Markdown
                  </TabsTrigger>
                  <TabsTrigger value="text" className="gap-1 px-3 py-1 text-xs">
                    <FileText className="h-3 w-3" />
                    Text
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
                      {prompt.responseContent || '응답 내용이 없습니다.'}
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
                  <CardTitle className="text-lg">Model Answer</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="mb-2 h-10 w-10 animate-spin opacity-20" />
                  <p>모델 응답을 기다리는 중입니다... (상태: {prompt.status})</p>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <div className="flex justify-center pt-4">
        <Button variant="outline" onClick={() => navigate(`/batches/${batchId}`)}>
          배치 상세 페이지로 돌아가기
        </Button>
      </div>
    </div>
  )
}
