import { atomWithStorage } from 'jotai/utils'

export type Locale = 'ko' | 'en'

const LOCALE_STORAGE_KEY = 'locale'

function isLocale(value: string | null): value is Locale {
  return value === 'ko' || value === 'en'
}

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'ko'
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY)

  return isLocale(storedLocale) ? storedLocale : 'ko'
}

export const localeAtom = atomWithStorage<Locale>(LOCALE_STORAGE_KEY, 'ko', undefined, {
  getOnInit: true,
})
