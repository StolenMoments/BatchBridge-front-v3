import { createRoot } from 'react-dom/client'

import './index.css'
import './plugins/i18n'
import App from './App.tsx'

// BatchBridge entry point
createRoot(document.getElementById('root')!).render(<App />)
