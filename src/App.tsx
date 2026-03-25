import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';

import { Layout } from './components/layout/Layout';
import { BatchListPage } from './pages/BatchListPage';
import { BatchCreatePage } from './pages/BatchCreatePage';
import { BatchDetailPage } from './pages/BatchDetailPage';
import { PromptDetailPage } from './pages/PromptDetailPage';
import { ThemeProvider } from './components/theme-provider';

function App() {
  return (
    <JotaiProvider>
      <ThemeProvider defaultTheme="system" storageKey="batchbridge-theme">
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/batches" replace />} />
              <Route path="/batches" element={<BatchListPage />} />
              <Route path="/batches/new" element={<BatchCreatePage />} />
              <Route path="/batches/:id" element={<BatchDetailPage />} />
              <Route path="/batches/:batchId/prompts/:promptId" element={<PromptDetailPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </JotaiProvider>
  );
}

export default App;
