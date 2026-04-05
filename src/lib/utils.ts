import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const EXTERNAL_EXTENSIONS = ['.jira', '.conf', '.github'] as const

export function isExternalContextFile(fileName: string): boolean {
  return EXTERNAL_EXTENSIONS.some(ext => fileName.endsWith(ext))
}
