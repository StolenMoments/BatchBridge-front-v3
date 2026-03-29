import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import batchEn from '../locales/en/batch.json'
import commonEn from '../locales/en/common.json'
import errorEn from '../locales/en/error.json'
import promptTemplateEn from '../locales/en/prompt_template.json'
import batchKo from '../locales/ko/batch.json'
import commonKo from '../locales/ko/common.json'
import errorKo from '../locales/ko/error.json'
import promptTemplateKo from '../locales/ko/prompt_template.json'

import { getStoredLocale } from '@/atoms/localeAtom'

const resources = {
  ko: {
    common: commonKo,
    batch: batchKo,
    error: errorKo,
    prompt_template: promptTemplateKo,
  },
  en: {
    common: commonEn,
    batch: batchEn,
    error: errorEn,
    prompt_template: promptTemplateEn,
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: getStoredLocale(),
  fallbackLng: 'ko',
  ns: ['common', 'batch', 'error', 'prompt_template'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
