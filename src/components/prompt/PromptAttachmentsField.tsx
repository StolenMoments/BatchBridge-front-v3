import { FileText, Upload, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'

import type { Attachment } from '@/types/api'
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const allowedExtensions = [
  'txt',
  'md',
  'java',
  'py',
  'json',
  'yaml',
  'yml',
  'js',
  'ts',
  'jsx',
  'tsx',
] as const

export interface PromptAttachmentsFieldProps {
  attachments: Attachment[]
  disabled?: boolean
  errorMessage?: string | null
  helperText?: string
  onChange: (attachments: Attachment[]) => void
  onErrorChange?: (message: string | null) => void
  onPendingChange?: (pending: boolean) => void
}

function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split('.')
  return parts.length > 1 ? (parts.at(-1) ?? '') : ''
}

function isAllowedFile(fileName: string): boolean {
  return allowedExtensions.includes(
    getFileExtension(fileName) as (typeof allowedExtensions)[number]
  )
}

function readFileAsText(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve({
        fileName: file.name,
        fileContent: typeof reader.result === 'string' ? reader.result : '',
      })
    }

    reader.onerror = () => {
      reject(new Error(`Failed to read ${file.name}.`))
    }

    reader.readAsText(file)
  })
}

async function buildAttachments(files: File[]): Promise<Attachment[]> {
  const invalidFile = files.find(file => !isAllowedFile(file.name))
  if (invalidFile) {
    throw new Error(
      `Unsupported file extension: ${invalidFile.name}. Only ${allowedExtensions.map(ext => `.${ext}`).join(', ')} files are allowed.`
    )
  }

  return Promise.all(files.map(readFileAsText))
}

export function PromptAttachmentsField({
  attachments,
  disabled = false,
  errorMessage,
  helperText = 'Click or drag and drop files to attach them.',
  onChange,
  onErrorChange,
  onPendingChange,
}: PromptAttachmentsFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const acceptedTypes = allowedExtensions.map(ext => `.${ext}`).join(',')

  const updateAttachments = async (files: File[]) => {
    if (files.length === 0 || disabled) return

    onPendingChange?.(true)
    try {
      const nextAttachments = await buildAttachments(files)
      const mergedAttachments = [...attachments]

      nextAttachments.forEach(nextAttachment => {
        const existingIndex = mergedAttachments.findIndex(
          attachment => attachment.fileName === nextAttachment.fileName
        )

        if (existingIndex >= 0) {
          mergedAttachments[existingIndex] = nextAttachment
          return
        }

        mergedAttachments.push(nextAttachment)
      })

      onChange(mergedAttachments)
      onErrorChange?.(null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to process the selected files.'
      onErrorChange?.(message)
    } finally {
      onPendingChange?.(false)
    }
  }

  const handleInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    await updateAttachments(files)
    event.target.value = ''
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    await updateAttachments(Array.from(event.dataTransfer.files))
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return
    }
    setIsDragging(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  const handleRemoveAttachment = (fileName: string) => {
    onChange(attachments.filter(attachment => attachment.fileName !== fileName))
    onErrorChange?.(null)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={inputId} className="text-sm font-medium text-foreground">
          Attachments
        </Label>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={acceptedTypes}
          multiple
          disabled={disabled}
          onChange={handleInputChange}
        />
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onClick={() => {
            if (!disabled) {
              inputRef.current?.click()
            }
          }}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onKeyDown={handleKeyDown}
          className={`rounded-xl border border-dashed p-5 transition-colors ${
            disabled
              ? 'cursor-not-allowed bg-muted/40 opacity-60'
              : isDragging
                ? 'border-primary bg-primary/5'
                : 'cursor-pointer hover:border-primary/60 hover:bg-muted/40'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <Upload className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Select files or drag and drop</p>
              <p className="text-xs text-muted-foreground">{helperText}</p>
              <p className="text-xs text-muted-foreground">
                Allowed types: {allowedExtensions.map(ext => `.${ext}`).join(', ')}
              </p>
            </div>
          </div>
        </div>
        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Attached files</p>
          <p className="text-xs text-muted-foreground">{attachments.length} files</p>
        </div>
        {attachments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No files attached.
          </div>
        ) : (
          <Accordion type="multiple" className="rounded-lg border">
            {attachments.map((attachment, index) => (
              <AccordionItem
                key={`${attachment.fileName}-${index}`}
                value={`${attachment.fileName}-${index}`}
                className="px-4"
              >
                <div className="flex items-start gap-3 py-1">
                  <FileText className="mt-3 h-4 w-4 shrink-0 text-muted-foreground" />
                  <AccordionTrigger className="flex-1 py-3 hover:no-underline">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{attachment.fileName}</span>
                      <span className="text-xs text-muted-foreground">
                        {attachment.fileContent.length.toLocaleString()} chars
                      </span>
                    </div>
                  </AccordionTrigger>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="mt-2 shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={disabled}
                    onClick={() => handleRemoveAttachment(attachment.fileName)}
                    aria-label={`Remove ${attachment.fileName}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <AccordionContent className="pb-4">
                  <div className="rounded-md border bg-muted/30 p-3 font-mono text-xs break-all whitespace-pre-wrap">
                    {attachment.fileContent}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  )
}
