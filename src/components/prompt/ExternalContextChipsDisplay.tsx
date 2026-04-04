import { ExternalLink, GitPullRequest, Ticket, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Attachment } from '@/types/api'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const EXTERNAL_EXTENSIONS = ['.jira', '.conf', '.github'] as const

export function isExternalContextFile(fileName: string): boolean {
  return EXTERNAL_EXTENSIONS.some(ext => fileName.endsWith(ext))
}

type ExternalFileType = 'jira' | 'confluence' | 'pr'

interface ParsedExternalFile {
  type: ExternalFileType
  label: string
}

function parseFileName(fileName: string): ParsedExternalFile {
  if (fileName.endsWith('.jira')) {
    return { type: 'jira', label: fileName.split('.')[0] }
  }
  if (fileName.endsWith('.conf')) {
    return { type: 'confluence', label: fileName.split('.')[0] }
  }
  // .github: {repo}.{prNumber}.{promptId}.github → "repo #prNumber"
  const base = fileName.slice(0, -7) // remove '.github'
  const parts = base.split('.')
  const prNumber = parts[parts.length - 2]
  const repoName = parts.slice(0, -2).join('.')
  return { type: 'pr', label: `${repoName} #${prNumber}` }
}

interface ExternalContextChipsDisplayProps {
  attachments: Attachment[]
  disabled?: boolean
  onRemove?: (fileName: string) => void
}

export function ExternalContextChipsDisplay({
  attachments,
  disabled = false,
  onRemove,
}: ExternalContextChipsDisplayProps) {
  const { t } = useTranslation('external_context')
  const [selected, setSelected] = useState<Attachment | null>(null)

  const externalAttachments = attachments.filter(a => isExternalContextFile(a.fileName))

  if (externalAttachments.length === 0) return null

  return (
    <>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{t('importedContext.title')}</p>
        <div className="flex flex-wrap gap-2">
          {externalAttachments.map(attachment => {
            const { type, label } = parseFileName(attachment.fileName)
            return (
              <Badge
                key={attachment.fileName}
                variant="outline"
                className="h-8 cursor-pointer gap-1.5 px-3 hover:bg-muted/50"
                onClick={() => setSelected(attachment)}
              >
                {type === 'jira' && <Ticket className="h-3.5 w-3.5 text-blue-500" />}
                {type === 'confluence' && <ExternalLink className="h-3.5 w-3.5 text-teal-500" />}
                {type === 'pr' && <GitPullRequest className="h-3.5 w-3.5 text-purple-500" />}
                <span className="text-xs">{label}</span>
                {!disabled && onRemove ? (
                  <button
                    type="button"
                    className="ml-0.5 rounded-full"
                    onClick={event => {
                      event.stopPropagation()
                      onRemove(attachment.fileName)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </Badge>
            )
          })}
        </div>
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={open => {
          if (!open) setSelected(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('importedContext.dialogTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-medium text-muted-foreground">{selected?.fileName}</p>
          <div className="max-h-[60vh] overflow-y-auto rounded-md border bg-muted/30 p-4 font-mono text-xs break-words whitespace-pre-wrap">
            {selected?.fileContent}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
