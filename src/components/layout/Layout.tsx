import { Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router-dom'

import { LocaleToggle } from '@/components/LocaleToggle'
import { ModeToggle } from '@/components/mode-toggle'

export function Layout() {
  const { t } = useTranslation('common')

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-7xl items-center px-4">
          <div className="mr-4 flex flex-1 items-center gap-6">
            <Link to="/batches" className="flex items-center space-x-2">
              <Layers className="h-6 w-6" />
              <span className="inline-block font-bold">BatchBridge</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <NavLink
                to="/templates"
                className={({ isActive }) =>
                  isActive
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground transition-colors hover:text-foreground'
                }
              >
                {t('navigation.templates')}
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center justify-end gap-2">
            <LocaleToggle />
            <ModeToggle />
          </div>
        </div>
      </header>
      <main className="container mx-auto max-w-7xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-border py-6 md:px-8 md:py-0">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-balance text-muted-foreground md:text-left">
            Built by BatchBridge Team. &copy; 2026.
          </p>
        </div>
      </footer>
    </div>
  )
}
