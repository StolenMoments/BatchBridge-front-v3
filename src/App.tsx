import { useAtomValue } from 'jotai'
import { Provider as JotaiProvider } from 'jotai'
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { localeAtom } from './atoms/localeAtom'
import { Layout } from './components/layout/Layout'
import { ThemeProvider } from './components/theme-provider'
import { BatchCreatePage } from './pages/BatchCreatePage'
import { BatchDetailPage } from './pages/BatchDetailPage'
import { BatchListPage } from './pages/BatchListPage'
import { PromptDetailPage } from './pages/PromptDetailPage'
import { PromptEditPage } from './pages/PromptEditPage'
import i18n from './plugins/i18n'

function LocaleSync() {
  const locale = useAtomValue(localeAtom)

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale)
    }
  }, [locale])

  return null
}

function App() {
  return (
    <JotaiProvider>
      <LocaleSync />
      <ThemeProvider defaultTheme="system" storageKey="batchbridge-theme">
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/batches" replace />} />
              <Route path="/batches" element={<BatchListPage />} />
              <Route path="/batches/new" element={<BatchCreatePage />} />
              <Route path="/batches/:id" element={<BatchDetailPage />} />
              <Route path="/batches/:batchId/prompts/:promptId" element={<PromptDetailPage />} />
              <Route path="/batches/:batchId/prompts/:promptId/edit" element={<PromptEditPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </JotaiProvider>
  )
}

export default App
