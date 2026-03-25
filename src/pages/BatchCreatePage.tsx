import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Send 
} from 'lucide-react';

import { batchService, modelService } from '@/services/api';
import type { Model } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function BatchCreatePage() {
  const navigate = useNavigate();
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);

  const [formData, setFormData] = useState({
    batchLabel: '',
    model: '',
    promptLabel: '',
    systemPrompt: '',
    userPrompt: '',
  });

  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true);
      try {
        const response = await modelService.getModels();
        if (response.success) {
          setModels(response.data);
          if (response.data.length > 0) {
            setFormData(prev => ({ ...prev, model: response.data[0].id }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoadingModels(false);
      }
    };
    fetchModels();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.model || !formData.userPrompt) return;

    setSubmitting(true);
    try {
      const response = await batchService.createBatch({
        label: formData.batchLabel || undefined,
        model: formData.model,
        prompt: {
          label: formData.promptLabel || undefined,
          systemPrompt: formData.systemPrompt || undefined,
          userPrompt: formData.userPrompt,
        },
      });

      if (response.success) {
        navigate(`/batches/${response.data.id}`);
      }
    } catch (error) {
      console.error('Failed to create batch:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">새 배치 만들기</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>배치 정보</CardTitle>
            <CardDescription>배치의 대상 모델과 이름을 설정합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">대상 모델 (필수)</Label>
              <Select 
                value={formData.model} 
                onValueChange={(value) => setFormData({ ...formData, model: value })}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder={loadingModels ? "모델을 불러오는 중..." : "모델 선택"} />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchLabel">배치 이름 (선택)</Label>
              <Input
                id="batchLabel"
                placeholder="배치를 구분할 이름을 입력하세요 (미입력 시 자동 생성)"
                value={formData.batchLabel}
                onChange={(e) => setFormData({ ...formData, batchLabel: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>첫 번째 프롬프트</CardTitle>
            <CardDescription>배치에 포함될 첫 번째 프롬프트를 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promptLabel">프롬프트 라벨 (선택)</Label>
              <Input
                id="promptLabel"
                placeholder="프롬프트 라벨 (미입력 시 자동 생성)"
                value={formData.promptLabel}
                onChange={(e) => setFormData({ ...formData, promptLabel: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-0 h-auto hover:bg-transparent"
                onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              >
                {showSystemPrompt ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                System Prompt (선택)
              </Button>
              {showSystemPrompt && (
                <Textarea
                  id="systemPrompt"
                  placeholder="System Prompt를 입력하세요"
                  className="min-h-[100px]"
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="userPrompt">User Prompt (필수)</Label>
              <Textarea
                id="userPrompt"
                placeholder="AI에게 전달할 요청 내용을 입력하세요"
                className="min-h-[200px]"
                required
                value={formData.userPrompt}
                onChange={(e) => setFormData({ ...formData, userPrompt: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>취소</Button>
            <Button type="submit" disabled={submitting || !formData.model || !formData.userPrompt}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  생성하기
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
