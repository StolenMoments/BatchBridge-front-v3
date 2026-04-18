import { format } from 'date-fns'
import { useAtom } from 'jotai'
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import type { BatchListItem, BatchStatus } from '@/types/api'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getApiErrorMessage } from '@/lib/api-error'
import { batchService } from '@/services/api'

interface BatchSummary {
  total: number | null
  inProgress: number | null
  failed: number | null
  lastRefreshedAt: Date | null
}

const STATUS_OPTIONS: Array<{ value: BatchStatus | 'ALL'; labelKey: string }> = [
  { value: 'ALL', labelKey: 'status.all' },
  { value: 'DRAFT', labelKey: 'status.draft' },
  { value: 'IN_PROGRESS', labelKey: 'status.inProgress' },
  { value: 'COMPLETED', labelKey: 'status.completed' },
  { value: 'FAILED', labelKey: 'status.failed' },
]

const PAGE_SIZE_OPTIONS = ['3', '6', '9']

export function BatchListPage() {
  const { t } = useTranslation(['batch', 'common'])
  const [batches, setBatches] = useAtom(batchesAtom)
  const [params, setParams] = useAtom(batchesParamsAtom)
  const [summary, setSummary] = useState<BatchSummary>({
    total: null,
    inProgress: null,
    failed: null,
    lastRefreshedAt: null,
  })
  const [loading, setLoading] = useState(false)
  const [deletingBatchId, setDeletingBatchId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshBatches = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)

      try {
        const listRequest = batchService.getBatches(
          {
            status: params.status === 'ALL' ? undefined : params.status,
            page: params.page,
            size: params.size,
          },
          { signal }
        )

        const totalRequest =
          params.status === 'ALL'
            ? Promise.resolve(null)
            : batchService.getBatches({ page: 1, size: 1 }, { signal })

        const inProgressRequest = batchService.getBatches(
          { status: 'IN_PROGRESS', page: 1, size: 1 },
          { signal }
        )

        const failedRequest = batchService.getBatches(
          { status: 'FAILED', page: 1, size: 1 },
          { signal }
        )

        const [listResponse, totalResponse, inProgressResponse, failedResponse] =
          await Promise.allSettled([listRequest, totalRequest, inProgressRequest, failedRequest])

        if (listResponse.status === 'rejected') {
          throw listResponse.reason
        }

        if (!listResponse.value.success) {
          throw new Error(t('list.loadFailed', { ns: 'batch' }))
        }

        setBatches(listResponse.value.data)
        setErrorMessage(null)

        const totalValue =
          params.status === 'ALL'
            ? listResponse.value.data.totalElements
            : totalResponse.status === 'fulfilled' && totalResponse.value?.success
              ? totalResponse.value.data.totalElements
              : null

        const totalLoaded = params.status === 'ALL' || totalValue !== null

        const inProgressLoaded =
          inProgressResponse.status === 'fulfilled' && inProgressResponse.value.success

        const failedLoaded = failedResponse.status === 'fulfilled' && failedResponse.value.success

        const refreshedAt = totalLoaded && inProgressLoaded && failedLoaded ? new Date() : null

        setSummary(prev => ({
          total: totalLoaded ? totalValue : prev.total,
          inProgress: inProgressLoaded
            ? inProgressResponse.value.data.totalElements
            : prev.inProgress,
          failed: failedLoaded ? failedResponse.value.data.totalElements : prev.failed,
          lastRefreshedAt: refreshedAt ?? prev.lastRefreshedAt,
        }))
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Failed to fetch batches:', error)
        setErrorMessage(getApiErrorMessage(error))
      } finally {
        setLoading(false)
      }
    },
    [params.page, params.size, params.status, setBatches, t]
  )

  useEffect(() => {
    const controller = new AbortController()
    void refreshBatches(controller.signal)

    const interval = setInterval(() => {
      void refreshBatches()
    }, 120000)

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [refreshBatches])

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
      void refreshBatches()
    } catch (error) {
      console.error('Failed to delete batch:', error)
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setDeletingBatchId(null)
    }
  }

  const formatSummaryValue = (value: number | null) => value ?? '-'

  const formatCreatedAt = (createdAt: string) => format(new Date(createdAt), 'yyyy-MM-dd HH:mm')

  const renderCountSummary = (batch: BatchListItem) => {
    if (batch.status === 'DRAFT') {
      return (
        <span className="text-sm font-medium text-muted-foreground">
          {t('list.notSubmitted', { ns: 'batch' })}
        </span>
      )
    }

    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium tabular-nums">
        <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t('list.successCount', { ns: 'batch', count: batch.successCount })}
        </span>
        <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
          <XCircle className="h-3.5 w-3.5" />
          {t('list.failedCount', { ns: 'batch', count: batch.failedCount })}
        </span>
      </div>
    )
  }

  const renderRowActions = (batch: BatchListItem) => (
    <div className="flex items-center justify-end gap-2">
      <Link to={`/batches/${batch.id}`}>
        <Button variant="outline" size="sm">
          <ArrowUpRight className="mr-2 h-4 w-4" />
          {t('list.open', { ns: 'batch' })}
        </Button>
      </Link>

      {batch.status === 'DRAFT' ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={deletingBatchId === batch.id}
          onClick={event => void handleDeleteBatch(event, batch.id)}
        >
          {deletingBatchId === batch.id ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          {t('actions.delete', { ns: 'common' })}
        </Button>
      ) : null}
    </div>
  )

  const renderDesktopTable = () => (
    <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>{t('list.columns.batch', { ns: 'batch' })}</TableHead>
            <TableHead>{t('list.columns.status', { ns: 'batch' })}</TableHead>
            <TableHead>{t('list.columns.createdAt', { ns: 'batch' })}</TableHead>
            <TableHead className="w-[1%] pr-4 text-left">
              {t('list.columns.actions', { ns: 'batch' })}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches?.content.map(batch => (
            <TableRow key={batch.id}>
              <TableCell className="py-4">
                <div className="min-w-0 space-y-1">
                  <Link
                    to={`/batches/${batch.id}`}
                    className="block truncate font-medium text-foreground hover:text-primary"
                  >
                    {batch.label}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">{batch.model}</p>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="space-y-2.5">
                  <StatusBadge status={batch.status} size="sm" />
                  <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5 tabular-nums">
                      <FileText className="h-3.5 w-3.5 opacity-80" />
                      {t('list.promptCount', { ns: 'batch', count: batch.promptCount })}
                    </span>
                  </div>
                  {renderCountSummary(batch)}
                </div>
              </TableCell>
              <TableCell className="py-4 text-sm text-muted-foreground">
                {formatCreatedAt(batch.createdAt)}
              </TableCell>
              <TableCell className="py-4 pr-4">{renderRowActions(batch)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const renderMobileRows = () => (
    <div className="space-y-3 md:hidden">
      {batches?.content.map(batch => (
        <div key={batch.id} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to={`/batches/${batch.id}`}
                className="block truncate font-medium text-foreground hover:text-primary"
              >
                {batch.label}
              </Link>
              <p className="mt-1 truncate text-sm text-muted-foreground">{batch.model}</p>
            </div>
            <StatusBadge status={batch.status} size="sm" className="shrink-0" />
          </div>

          <div className="mt-4 grid gap-2.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-sm font-medium tabular-nums">
              <FileText className="h-4 w-4 opacity-80" />
              <span>{t('list.promptCount', { ns: 'batch', count: batch.promptCount })}</span>
            </div>
            {renderCountSummary(batch)}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatCreatedAt(batch.createdAt)}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/batches/${batch.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                {t('list.open', { ns: 'batch' })}
              </Button>
            </Link>
            {batch.status === 'DRAFT' ? (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={deletingBatchId === batch.id}
                onClick={event => void handleDeleteBatch(event, batch.id)}
              >
                {deletingBatchId === batch.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {t('actions.delete', { ns: 'common' })}
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )

  const renderEmptyState = () => {
    const isFiltered = params.status && params.status !== 'ALL'

    return (
      <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-14 text-center">
        <Search className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{t('list.emptyTitle', { ns: 'batch' })}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isFiltered
            ? t('list.emptyFiltered', {
                ns: 'batch',
                status: t(
                  STATUS_OPTIONS.find(option => option.value === params.status)?.labelKey ??
                    'status.all',
                  { ns: 'common' }
                ),
              })
            : t('list.empty', { ns: 'batch' })}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refreshBatches()}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('actions.refresh', { ns: 'common' })}
          </Button>
          <Link to="/batches/new">
            <Button size="sm">{t('list.newBatch', { ns: 'batch' })}</Button>
          </Link>
        </div>
      </div>
    )
  }

  const renderLoadingState = () => (
    <div className="rounded-xl border bg-card px-6 py-18">
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('list.loading', { ns: 'batch' })}</p>
      </div>
    </div>
  )

  const renderContent = () => {
    if (loading && !batches) {
      return renderLoadingState()
    }

    if (!batches || batches.content.length === 0) {
      return renderEmptyState()
    }

    return (
      <div className="space-y-3">
        {renderDesktopTable()}
        {renderMobileRows()}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('list.title', { ns: 'batch' })}
        description={t('list.description', { ns: 'batch' })}
      />

      <MetaStrip
        className="rounded-xl border bg-muted/20 px-4 py-3"
        items={[
          {
            icon: Layers,
            label: t('list.summary.total', { ns: 'batch' }),
            value: formatSummaryValue(summary.total),
          },
          {
            icon: RefreshCw,
            label: t('list.summary.inProgress', { ns: 'batch' }),
            value: formatSummaryValue(summary.inProgress),
          },
          {
            icon: TriangleAlert,
            label: t('list.summary.failed', { ns: 'batch' }),
            value: formatSummaryValue(summary.failed),
          },
          {
            icon: Clock,
            value: summary.lastRefreshedAt
              ? t('list.summary.lastRefreshed', {
                  ns: 'batch',
                  time: format(summary.lastRefreshedAt, 'HH:mm'),
                })
              : t('list.summary.lastRefreshedPending', { ns: 'batch' }),
          },
        ]}
      />

      <Toolbar
        className="gap-3 border-b-0 pb-0"
        filters={
          <Tabs value={params.status || 'ALL'} onValueChange={handleStatusChange}>
            <TabsList className="flex h-auto flex-wrap justify-start">
              {STATUS_OPTIONS.map(option => (
                <TabsTrigger key={option.value} value={option.value}>
                  {t(option.labelKey, { ns: 'common' })}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
        controls={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap text-muted-foreground">
                {t('labels.pageSize', { ns: 'common' })}
              </span>
              <Select value={params.size.toString()} onValueChange={handleSizeChange}>
                <SelectTrigger className="w-[88px]">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void refreshBatches()}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t('actions.refresh', { ns: 'common' })}
            </Button>

            <Link to="/batches/new">
              <Button size="sm" className="w-full sm:w-auto">
                {t('list.newBatch', { ns: 'batch' })}
              </Button>
            </Link>
          </div>
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
