import { Link, Outlet } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center max-w-7xl mx-auto px-4">
          <div className="mr-4 flex flex-1">
            <Link to="/batches" className="mr-6 flex items-center space-x-2">
              <Layers className="h-6 w-6" />
              <span className="font-bold inline-block">BatchBridge</span>
            </Link>
          </div>
          <div className="flex items-center justify-end">
            <ModeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-border py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row max-w-7xl mx-auto px-4">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by BatchBridge Team. &copy; 2026.
          </p>
        </div>
      </footer>
    </div>
  );
}
