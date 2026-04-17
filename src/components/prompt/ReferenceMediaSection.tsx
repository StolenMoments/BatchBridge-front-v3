import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ReferenceMediaSectionProps {
  referenceMediaUrl: string
  onReferenceMediaUrlChange: (url: string) => void
}

export function ReferenceMediaSection({
  referenceMediaUrl,
  onReferenceMediaUrlChange,
}: ReferenceMediaSectionProps) {
  const { t } = useTranslation('batch')

  return (
    <div className="space-y-2">
      <Label htmlFor="referenceMediaUrl">{t('create.referenceMediaLabel')}</Label>
      <Input
        id="referenceMediaUrl"
        placeholder={t('create.referenceMediaUrlPlaceholder')}
        value={referenceMediaUrl}
        onChange={event => onReferenceMediaUrlChange(event.target.value)}
      />
    </div>
  )
}
