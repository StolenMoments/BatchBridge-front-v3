import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Prompt } from '@/types/api'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePromptTypeLabels } from '@/hooks/usePromptType'

interface ReferenceMediaSectionProps {
  batchPrompts: Prompt[]
  referenceMediaUrl: string
  referencePromptId: number | null
  onReferenceMediaUrlChange: (url: string) => void
  onReferencePromptIdChange: (id: number | null) => void
}

type TabValue = 'url' | 'previous'

export function ReferenceMediaSection({
  batchPrompts,
  referenceMediaUrl,
  referencePromptId,
  onReferenceMediaUrlChange,
  onReferencePromptIdChange,
}: ReferenceMediaSectionProps) {
  const { t } = useTranslation('batch')
  const promptTypeLabels = usePromptTypeLabels()

  const [activeTab, setActiveTab] = useState<TabValue>(
    referencePromptId !== null ? 'previous' : 'url'
  )

  const completedPrompts = batchPrompts.filter(p => p.status === 'COMPLETED' && p.resultMediaUrl)

  const handleTabChange = (value: string) => {
    const tab = value as TabValue
    setActiveTab(tab)
    if (tab === 'url') {
      onReferencePromptIdChange(null)
    } else {
      onReferenceMediaUrlChange('')
    }
  }

  return (
    <div className="space-y-2">
      <Label>{t('create.referenceMediaLabel')}</Label>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="url">{t('create.referenceMediaTabUrl')}</TabsTrigger>
          <TabsTrigger value="previous">{t('create.referenceMediaTabPrevious')}</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="mt-2">
          <Input
            placeholder={t('create.referenceMediaUrlPlaceholder')}
            value={referenceMediaUrl}
            onChange={event => onReferenceMediaUrlChange(event.target.value)}
          />
        </TabsContent>

        <TabsContent value="previous" className="mt-2">
          <Select
            value={referencePromptId !== null ? String(referencePromptId) : ''}
            onValueChange={value => {
              if (value === '__none__') {
                onReferencePromptIdChange(null)
              } else {
                onReferencePromptIdChange(Number.parseInt(value, 10))
              }
            }}
            disabled={completedPrompts.length === 0}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  completedPrompts.length === 0
                    ? t('create.referenceMediaPreviousEmpty')
                    : t('create.referenceMediaPreviousPlaceholder')
                }
              />
            </SelectTrigger>
            <SelectContent>
              {referencePromptId !== null ? (
                <SelectItem value="__none__">{t('create.referenceMediaPreviousNone')}</SelectItem>
              ) : null}
              {completedPrompts.map((prompt, index) => (
                <SelectItem key={prompt.id} value={String(prompt.id)}>
                  {prompt.label ? prompt.label : `#${index + 1}`} —{' '}
                  {promptTypeLabels[prompt.promptType ?? 'TEXT']}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TabsContent>
      </Tabs>
    </div>
  )
}
