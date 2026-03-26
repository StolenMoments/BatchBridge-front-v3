import { format } from 'date-fns'
import { useAtom } from 'jotai'
import {
  Plus,
  RefreshCw,
  Search,
  Clock,
  Cpu,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

import type { BatchStatus } from '@/types/api'

import { batchesAtom, batchesParamsAtom } from '@/atoms/batches'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { batchService } from '@/services/api'

const statusMap: Record<
  BatchStatus,
  { label: string; color: string; gradient: string; icon: LucideIcon }
> = {
  DRAFT: {
    label: '초안',
    color: 'bg-slate-500',
    gradient: 'from-slate-500/10 to-transparent',
    icon: FileText,
  },
  IN_PROGRESS: {
    label: '처리중',
    color: 'bg-blue-500',
    gradient: 'from-blue-500/10 to-transparent',
    icon: Loader2,
  },
  COMPLETED: {
    label: '완료',
    color: 'bg-green-500',
    gradient: 'from-green-500/10 to-transparent',
    icon: CheckCircle2,
  },
  FAILED: {
    label: '실패',
    color: 'bg-red-500',
    gradient: 'from-red-500/10 to-transparent',
    icon: XCircle,
  },
}

export function BatchListPage() {
  const [batches, setBatches] = useAtom(batchesAtom)
  const [params, setParams] = useAtom(batchesParamsAtom)
  const [loading, setLoading] = useState(false)

  const fetchBatches = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      try {
        const response = await batchService.getBatches(
          {
            status: params.status === 'ALL' ? undefined : params.status,
            page: params.page,
            size: params.size,
          },
          { signal }
        )
        if (response.success) {
          setBatches(response.data)
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Failed to fetch batches:', error)
      } finally {
        setLoading(false)
      }
    },
    [params.status, params.page, params.size, setBatches]
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchBatches(controller.signal)

    // 2분마다 자동 갱신
    const interval = setInterval(() => {
      fetchBatches()
    }, 120000)

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [fetchBatches])

  const handleStatusChange = (status: string) => {
    setParams(prev => ({ ...prev, status: status as BatchStatus | 'ALL', page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setParams(prev => ({ ...prev, page }))
  }

  const handleSizeChange = (size: string) => {
    setParams(prev => ({ ...prev, size: Number.parseInt(size), page: 1 }))
  }

  const renderContent = () => {
    if (loading && !batches) {
      return (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    if (batches?.content.length === 0) {
      return (
        <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed">
          <Search className="mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">표시할 배치가 없습니다.</p>
          <Link to="/batches/new" className="mt-4">
            <Button variant="link">첫 배치를 만들어보세요</Button>
          </Link>
        </div>
      )
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {batches?.content.map(batch => {
          const status = statusMap[batch.status]
          const StatusIcon = status.icon

          return (
            <Link key={batch.id} to={`/batches/${batch.id}`}>
              <Card
                className={`h-full bg-linear-to-br transition-all hover:border-primary/80 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] dark:hover:bg-accent/10 dark:hover:shadow-[0_0_15px_rgba(var(--primary),0.2)] ${status.gradient} group`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle
                    className={`truncate px-2 py-1 text-lg font-bold ${status.color} rounded-md text-white transition-all group-hover:ring-2 group-hover:ring-primary/30`}
                  >
                    {batch.label}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className={`${status.color} flex h-8 items-center px-3 py-1.5 text-sm font-medium text-white`}
                  >
                    <StatusIcon
                      className={`mr-2 h-4 w-4 ${batch.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`}
                    />
                    {status.label}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 text-xs text-muted-foreground">ID: {batch.id}</div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Cpu className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{batch.model}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>프롬프트 {batch.promptCount}개</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(batch.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    자세히 보기
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">배치 목록</h1>
          <p className="text-muted-foreground">생성된 배치들의 상태와 결과를 한눈에 확인하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchBatches()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Link to="/batches/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />새 배치 만들기
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-b border-border pb-4 md:flex-row">
        <Tabs
          defaultValue={params.status || 'ALL'}
          className="w-full md:w-auto"
          onValueChange={handleStatusChange}
        >
          <TabsList>
            <TabsTrigger value="ALL">전체</TabsTrigger>
            <TabsTrigger value="DRAFT">초안</TabsTrigger>
            <TabsTrigger value="IN_PROGRESS">처리중</TabsTrigger>
            <TabsTrigger value="COMPLETED">완료</TabsTrigger>
            <TabsTrigger value="FAILED">실패</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <span className="text-sm whitespace-nowrap text-muted-foreground">페이지 당 표시:</span>
          <Select value={params.size.toString()} onValueChange={handleSizeChange}>
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="9">9</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderContent()}

      {batches && batches.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, params.page - 1))}
                className={params.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: batches.totalPages }).map((_, i) => (
              <PaginationItem key={`page-${i + 1}`}>
                <PaginationLink
                  isActive={params.page === i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className="cursor-pointer"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(batches.totalPages, params.page + 1))}
                className={
                  params.page === batches.totalPages
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
