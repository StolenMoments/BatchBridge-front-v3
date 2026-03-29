import { useAtom } from 'jotai'

import type { Locale } from '@/atoms/localeAtom'

import { localeAtom } from '@/atoms/localeAtom'
import { Button } from '@/components/ui/button'
import i18n from '@/plugins/i18n'

const NEXT_LOCALE_BY_CURRENT: Record<Locale, Locale> = {
  ko: 'en',
  en: 'ko',
}

const LABEL_BY_CURRENT: Record<Locale, string> = {
  ko: 'EN',
  en: '\uD55C',
}

const ARIA_LABEL_BY_NEXT: Record<Locale, string> = {
  ko: 'Switch language to Korean',
  en: 'Switch language to English',
}

export function LocaleToggle() {
  const [locale, setLocale] = useAtom(localeAtom)

  const nextLocale = NEXT_LOCALE_BY_CURRENT[locale]

  const handleToggle = () => {
    setLocale(nextLocale)
    void i18n.changeLanguage(nextLocale)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-w-9 px-2.5 font-semibold"
      aria-label={ARIA_LABEL_BY_NEXT[nextLocale]}
      onClick={handleToggle}
    >
      {LABEL_BY_CURRENT[locale]}
    </Button>
  )
}
