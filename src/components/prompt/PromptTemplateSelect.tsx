import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PROMPT_TEMPLATE_IDS = ['codeReview', 'summarize', 'translate'] as const

type PromptTemplateId = (typeof PROMPT_TEMPLATE_IDS)[number]

interface PromptTemplateSelectProps {
  disabled?: boolean
  onSelectTemplate: (template: string) => void
}

function isPromptTemplateId(value: string): value is PromptTemplateId {
  return PROMPT_TEMPLATE_IDS.some(templateId => templateId === value)
}

export function PromptTemplateSelect({
  disabled = false,
  onSelectTemplate,
}: PromptTemplateSelectProps) {
  const { t } = useTranslation('prompt_template')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  const handleValueChange = (value: string) => {
    if (!isPromptTemplateId(value)) {
      return
    }

    setSelectedTemplateId(value)
    onSelectTemplate(t(`templates.${value}.content`))
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="prompt-template-select">{t('label')}</Label>
      <Select disabled={disabled} value={selectedTemplateId} onValueChange={handleValueChange}>
        <SelectTrigger id="prompt-template-select">
          <SelectValue placeholder={t('placeholder')} />
        </SelectTrigger>
        <SelectContent>
          {PROMPT_TEMPLATE_IDS.map(templateId => (
            <SelectItem key={templateId} value={templateId}>
              {t(`templates.${templateId}.label`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">{t('description')}</p>
      <p className="text-xs text-muted-foreground">{t('replaceNotice')}</p>
    </div>
  )
}
