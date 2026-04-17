import { format } from 'date-fns'
import { useAtom } from 'jotai'
import {
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import type { BatchStatus } from '@/types/api'

import { batchesAtom, batchesParamsAtom } from '@/atoms/batches'
import { ErrorAlert } from '@/components/feedback/ErrorAlert'
import { PageHeader } from '@/components/layout/PageHeader'
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
import { getApiErrorMessage } from '@/lib/api-error'
import { statusAppearanceMap } from '@/lib/batch-status'
import { batchService } from '@/services/api'

export function BatchListPage() {
  const { t } = useTranslation(['batch', 'common'])
  const [batches, setBatches] = useAtom(batchesAtom)
  const [params, setParams] = useAtom(batchesParamsAtom)
  const [loading, setLoading] = useState(false)
  const [deletingBatchId, setDeletingBatchId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const statusLabelMap: Record<BatchStatus, string> = {
    DRAFT: t('status.draft', { ns: 'common' }),
    IN_PROGRESS: t('status.inProgress', { ns: 'common' }),
    COMPLETED: t('status.completed', { ns: 'common' }),
    FAILED: t('status.failed', { ns: 'common' }),
  }

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {batches?.content.map(batch => {
          const status = statusAppearanceMap[batch.status]
          const StatusIcon = status.icon

          return (
            <Link key={batch.id} to={`/batches/${batch.id}`}>
              <Card
                className={`group h-full bg-linear-to-br transition-all hover:border-primary/80 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] dark:hover:bg-accent/10 dark:hover:shadow-[0_0_15px_rgba(var(--primary),0.2)] ${status.gradient}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle
                    className={`truncate rounded-md px-2 py-1 text-lg font-bold text-white transition-all group-hover:ring-2 group-hover:ring-primary/30 ${status.color}`}
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
                    {statusLabelMap[batch.status]}
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
                      <span>
                        {t('list.promptCount', { ns: 'batch', count: batch.promptCount })}
                      </span>
                    </div>
                    {batch.status !== 'DRAFT' &&
                    (batch.successCount > 0 || batch.failedCount > 0) ? (
                      <div className="flex items-center gap-1 text-sm">
                        {batch.successCount > 0 ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-green-600 dark:text-green-400">
                              {t('list.successCount', { ns: 'batch', count: batch.successCount })}
                            </span>
                          </>
                        ) : null}
                        {batch.successCount > 0 && batch.failedCount > 0 ? (
                          <span className="mx-1 text-muted-foreground">/</span>
                        ) : null}
                        {batch.failedCount > 0 ? (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-red-600 dark:text-red-400">
                              {t('list.failedCount', { ns: 'batch', count: batch.failedCount })}
                            </span>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(batch.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="gap-2 pt-2">
                  <Button variant="ghost" size="sm" className="flex-1 text-xs">
                    {t('list.viewDetails', { ns: 'batch' })}
                  </Button>
                  {batch.status === 'DRAFT' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
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
      <PageHeader
        title={t('list.title', { ns: 'batch' })}
        description={t('list.description', { ns: 'batch' })}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchBatches()}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t('actions.refresh', { ns: 'common' })}
            </Button>
            <Link to="/batches/new">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t('list.newBatch', { ns: 'batch' })}
              </Button>
            </Link>
          </>
        }
      />

      <div className="flex flex-col items-center justify-between gap-4 border-b border-border pb-4 md:flex-row">
        <Tabs
          defaultValue={params.status || 'ALL'}
          className="w-full md:w-auto"
          onValueChange={handleStatusChange}
        >
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

        <div className="flex items-center gap-2">
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
        </div>
      </div>

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
