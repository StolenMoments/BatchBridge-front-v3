import { format } from 'date-fns'
import { useAtom } from 'jotai'
import {
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import type { BatchStatus } from '@/types/api'

import { batchesAtom, batchesParamsAtom } from '@/atoms/batches'
import { ErrorAlert } from '@/components/feedback/ErrorAlert'
import { MetaStrip } from '@/components/layout/MetaStrip'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/layout/StatusBadge'
import { Toolbar } from '@/components/layout/Toolbar'
import { Button } from '@/components/ui/button'
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
import { getApiErrorMessage } from '@/lib/api-error'
import { batchService } from '@/services/api'

export function BatchListPage() {
  const { t } = useTranslation(['batch', 'common'])
  const [batches, setBatches] = useAtom(batchesAtom)
  const [params, setParams] = useAtom(batchesParamsAtom)
  const [loading, setLoading] = useState(false)
  const [deletingBatchId, setDeletingBatchId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
          setErrorMessage(null)
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Failed to fetch batches:', error)
        setErrorMessage(getApiErrorMessage(error))
      } finally {
        setLoading(false)
      }
    },
    [params.page, params.size, params.status, setBatches]
  )

  useEffect(() => {
    const controller = new AbortController()
    void fetchBatches(controller.signal)

    const interval = setInterval(() => {
      void fetchBatches()
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
    setParams(prev => ({ ...prev, size: Number.parseInt(size, 10), page: 1 }))
  }

  const handleDeleteBatch = async (event: React.MouseEvent, batchId: number) => {
    event.preventDefault()
    event.stopPropagation()

    if (!confirm(t('detail.deleteBatchConfirm', { ns: 'batch' }))) return

    setDeletingBatchId(batchId)
    try {
      await batchService.deleteBatch(batchId)
      toast.warning(t('detail.deleteBatchSuccess', { ns: 'batch' }))
      void fetchBatches()
    } catch (error) {
      console.error('Failed to delete batch:', error)
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setDeletingBatchId(null)
    }
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
          <p className="text-muted-foreground">{t('list.empty', { ns: 'batch' })}</p>
          <Link to="/batches/new" className="mt-4">
            <Button variant="link">{t('list.createFirst', { ns: 'batch' })}</Button>
          </Link>
        </div>
      )
    }

    return (
      <div className="divide-y divide-border rounded-lg border">
        {batches?.content.map(batch => (
          <Link key={batch.id} to={`/batches/${batch.id}`} className="block">
            <div className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{batch.label}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{batch.model}</p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={batch.status} size="sm" />

                <span className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
                  <FileText className="h-3.5 w-3.5" />
                  {t('list.promptCount', { ns: 'batch', count: batch.promptCount })}
                </span>

                {batch.status !== 'DRAFT' && (batch.successCount > 0 || batch.failedCount > 0) ? (
                  <span className="hidden items-center gap-2 text-sm md:flex">
                    {batch.successCount > 0 ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {batch.successCount}
                      </span>
                    ) : null}
                    {batch.failedCount > 0 ? (
                      <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                        <Search className="h-3.5 w-3.5" />
                        {batch.failedCount}
                      </span>
                    ) : null}
                  </span>
                ) : null}

                <span className="hidden items-center gap-1 text-sm text-muted-foreground lg:flex">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(batch.createdAt), 'yyyy-MM-dd HH:mm')}
                </span>

                {batch.status === 'DRAFT' ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-500"
                    disabled={deletingBatchId === batch.id}
                    onClick={event => void handleDeleteBatch(event, batch.id)}
                  >
                    {deletingBatchId === batch.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('list.title', { ns: 'batch' })}
        description={t('list.description', { ns: 'batch' })}
        actions={
          <Link to="/batches/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t('list.newBatch', { ns: 'batch' })}
            </Button>
          </Link>
        }
      />

      <MetaStrip
        items={[
          {
            icon: Layers,
            label: t('list.totalBatches', { ns: 'batch' }),
            value: batches?.totalElements ?? '-',
          },
        ]}
      />

      <Toolbar
        filters={
          <Tabs value={params.status || 'ALL'} onValueChange={handleStatusChange}>
            <TabsList>
              <TabsTrigger value="ALL">{t('status.all', { ns: 'common' })}</TabsTrigger>
              <TabsTrigger value="DRAFT">{t('status.draft', { ns: 'common' })}</TabsTrigger>
              <TabsTrigger value="IN_PROGRESS">
                {t('status.inProgress', { ns: 'common' })}
              </TabsTrigger>
              <TabsTrigger value="COMPLETED">{t('status.completed', { ns: 'common' })}</TabsTrigger>
              <TabsTrigger value="FAILED">{t('status.failed', { ns: 'common' })}</TabsTrigger>
            </TabsList>
          </Tabs>
        }
        controls={
          <>
            <span className="text-sm whitespace-nowrap text-muted-foreground">
              {t('labels.pageSize', { ns: 'common' })}
            </span>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchBatches()}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t('actions.refresh', { ns: 'common' })}
            </Button>
          </>
        }
      />

      {errorMessage ? <ErrorAlert message={errorMessage} /> : null}

      {renderContent()}

      {batches && batches.totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, params.page - 1))}
                className={params.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: batches.totalPages }).map((_, index) => (
              <PaginationItem key={`page-${index + 1}`}>
                <PaginationLink
                  isActive={params.page === index + 1}
                  onClick={() => handlePageChange(index + 1)}
                  className="cursor-pointer"
                >
                  {index + 1}
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
      ) : null}
    </div>
  )
}
