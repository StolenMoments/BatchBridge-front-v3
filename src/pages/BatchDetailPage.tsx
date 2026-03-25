import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
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
  Trash2,
  type LucideIcon,
} from "lucide-react"

import { batchService } from '@/services/api';
import type { Batch, BatchStatus } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const statusMap: Record<
  BatchStatus,
  { label: string; color: string; icon: LucideIcon }
> = {
  DRAFT: { label: "초안", color: "bg-slate-500", icon: FileText },
  IN_PROGRESS: { label: "처리중", color: "bg-blue-500", icon: Loader2 },
  COMPLETED: { label: "완료", color: "bg-green-500", icon: CheckCircle2 },
  FAILED: { label: "실패", color: "bg-red-500", icon: XCircle },
}

export function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // New Prompt Form (for DRAFT status)
  const [newPrompt, setNewPrompt] = useState({
    label: '',
    systemPrompt: '',
    userPrompt: '',
  });

  const fetchBatch = async (showLoading = true) => {
    if (!id) return;
    if (showLoading) setLoading(true);
    try {
      const response = await batchService.getBatch(parseInt(id));
      if (response.success) {
        // Ensure the batch state is actually updated with fresh data
        setBatch({ ...response.data });
      }
    } catch (error) {
      console.error('Failed to fetch batch:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatch();
  }, [id]);

  const handleSubmitBatch = async () => {
    if (!batch) return;
    setSubmitting(true);
    try {
      const response = await batchService.submitBatch(batch.id);
      if (response.success) {
        navigate('/batches');
      }
    } catch (error) {
      console.error('Failed to submit batch:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncBatch = async () => {
    if (!batch) return;
    setSyncing(true);
    try {
      const response = await batchService.syncBatch(batch.id);
      if (response.success) {
        setBatch(response.data);
      }
    } catch (error) {
      console.error('Failed to sync batch:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleAddPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !newPrompt.userPrompt) return;

    try {
      const response = await batchService.addPrompt(batch.id, {
        label: newPrompt.label || undefined,
        systemPrompt: newPrompt.systemPrompt || undefined,
        userPrompt: newPrompt.userPrompt,
      });

      if (response.success) {
        setNewPrompt({ label: '', systemPrompt: '', userPrompt: '' });
        // Update local state directly to ensure immediate UI update
        if (response.data) {
          setBatch(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              prompts: [...(prev.prompts || []), response.data]
            };
          });
        }
        fetchBatch(false);
      }
    } catch (error) {
      console.error('Failed to add prompt:', error);
    }
  };

  const handleDeletePrompt = async (promptId: number) => {
    if (!batch || !confirm('프롬프트를 삭제하시겠습니까?')) return;

    try {
      await batchService.deletePrompt(batch.id, promptId);
      // Optimistic update
      setBatch(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          prompts: prev.prompts?.filter(p => p.id !== promptId) || []
        };
      });
      // Also refetch from server to ensure sync
      fetchBatch(false);
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  if (loading && !batch) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">배치를 찾을 수 없습니다.</p>
        <Button variant="link" onClick={() => navigate('/batches')}>목록으로 돌아가기</Button>
      </div>
    );
  }

  const status = statusMap[batch.status];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/batches')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{batch.label}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground ml-11">
            <div className="flex items-center gap-1">
              <Cpu className="h-4 w-4" /> {batch.model}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> 생성: {format(new Date(batch.createdAt), 'yyyy-MM-dd HH:mm')}
            </div>
            {batch.submittedAt && (
              <div className="flex items-center gap-1">
                <Send className="h-4 w-4" /> 제출: {format(new Date(batch.submittedAt), 'yyyy-MM-dd HH:mm')}
              </div>
            )}
            {batch.completedAt && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> 완료: {format(new Date(batch.completedAt), 'yyyy-MM-dd HH:mm')}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 md:mt-1">
          <Badge className={`${status.color} text-white px-3 py-1`}>
            <StatusIcon className={`mr-2 h-4 w-4 ${batch.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
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
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              배치 제출하기
            </Button>
          )}
        </div>
      </div>

      {batch.errorMessage && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2 text-lg">
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
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> 프롬프트 목록 ({batch.prompts?.length || 0})
          </h2>
        </div>

        {batch.status === 'DRAFT' ? (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Prompt List (Left) */}
            <div className="lg:col-span-7 space-y-4">
              {batch.prompts?.map((prompt, index) => (
                <Card key={prompt.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base">
                      <Link 
                        to={`/batches/${batch.id}/prompts/${prompt.id}`}
                        className="hover:underline flex items-center gap-1 text-primary dark:text-primary-foreground font-semibold"
                      >
                        {index + 1}. {prompt.label} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">DRAFT</Badge>
                  </CardHeader>
                  <CardContent className="py-2 px-4 space-y-2">
                    {prompt.systemPrompt && (
                      <div className="text-xs bg-muted p-2 rounded border">
                        <span className="font-semibold block mb-1 text-foreground">System Prompt:</span>
                        <p className="line-clamp-2 text-muted-foreground">{prompt.systemPrompt}</p>
                      </div>
                    )}
                    <div className="text-sm">
                      <p className="line-clamp-3 whitespace-pre-wrap">{prompt.userPrompt}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="py-2 px-4 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeletePrompt(prompt.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {batch.prompts?.length === 0 && (
                <div className="text-center py-10 border border-dashed rounded-lg">
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
                      <Label htmlFor="p-label" className="text-sm font-medium text-foreground">라벨 (선택)</Label>
                      <Input 
                        id="p-label" 
                        placeholder="프롬프트 구분용 라벨"
                        value={newPrompt.label}
                        onChange={(e) => setNewPrompt({ ...newPrompt, label: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="p-system" className="text-sm font-medium text-foreground">System Prompt (선택)</Label>
                      <Textarea 
                        id="p-system" 
                        placeholder="System Prompt" 
                        className="min-h-[80px] text-sm"
                        value={newPrompt.systemPrompt}
                        onChange={(e) => setNewPrompt({ ...newPrompt, systemPrompt: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="p-user" className="text-sm font-medium text-foreground">User Prompt (필수)</Label>
                      <Textarea 
                        id="p-user" 
                        placeholder="User Prompt" 
                        required 
                        className="min-h-[150px] text-sm"
                        value={newPrompt.userPrompt}
                        onChange={(e) => setNewPrompt({ ...newPrompt, userPrompt: e.target.value })}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button type="submit" className="w-full" disabled={!newPrompt.userPrompt}>
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
            {batch.prompts?.map((prompt) => (
              <Card key={prompt.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Link 
                      to={`/batches/${batch.id}/prompts/${prompt.id}`}
                      className="text-lg font-bold hover:underline flex items-center gap-1 text-primary dark:text-primary-foreground"
                    >
                      {prompt.label} <ExternalLink className="h-3 w-3" />
                    </Link>
                    <Badge variant={prompt.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-[10px] h-5">
                      {prompt.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion type="multiple" defaultValue={["input", "output"]} className="w-full">
                    <AccordionItem value="input" className="border-none">
                      <AccordionTrigger className="px-4 py-2 hover:no-underline text-xs text-muted-foreground uppercase tracking-wider">
                        입력 내용 (User Prompt)
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="text-sm bg-muted/50 p-4 rounded-md border whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                          {prompt.userPrompt}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    {prompt.status === 'COMPLETED' && prompt.responseContent && (
                      <AccordionItem value="output" className="border-none">
                        <AccordionTrigger className="px-4 py-2 hover:no-underline text-xs text-green-600 dark:text-green-400 uppercase tracking-wider font-semibold">
                          모델 응답 (Answer)
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="prose prose-sm dark:prose-invert max-w-none bg-background p-4 rounded-md border shadow-sm max-h-[400px] overflow-y-auto">
                            <ReactMarkdown>{prompt.responseContent}</ReactMarkdown>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    
                    {prompt.errorMessage && (
                      <div className="px-4 pb-4">
                        <div className="text-sm bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded border border-red-200">
                          <span className="font-bold block mb-1">에러:</span>
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
  );
}
