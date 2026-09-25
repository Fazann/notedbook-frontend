'use client';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useMediaQuery } from '@/hooks/use-media-query';
import { usePreferencesStore } from '@/stores/preferences-store';

import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { Container } from './container';
import { MobileNav } from './mobile-nav';
import { QuickAddFab } from './quick-add-fab';
import { SearchCommand } from './search-command';

export type AppShellProps = {
  children: React.ReactNode;
  /** Account menu for the header (avatar button). */
  headerUser?: React.ReactNode;
  /** Account menu for the sidebar footer (full row). */
  sidebarUser?: React.ReactNode;
  /** App-wide dialogs (e.g. quick add expense). */
  overlays?: React.ReactNode;
};

export function AppShell({ children, headerUser, sidebarUser, overlays }: AppShellProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isCollapsed = usePreferencesStore((s) => s.isSidebarCollapsed);
  const setCollapsed = usePreferencesStore((s) => s.setSidebarCollapsed);

  // Desktop: always expanded. Tablet: collapsible to icons, remembered in preferences.
  // Phone: the shadcn Sidebar renders as a Sheet and manages its own open state.
  const open = isDesktop || !isCollapsed;

  return (
    <SidebarProvider
      open={open}
      onOpenChange={(next) => {
        if (!isDesktop) setCollapsed(!next);
      }}
    >
      <AppSidebar userSlot={sidebarUser} />
      <SidebarInset className="min-w-0">
        <AppHeader userSlot={headerUser} />
        <main className="flex-1 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))] md:py-6">
          <Container>{children}</Container>
        </main>
      </SidebarInset>
      <MobileNav />
      <QuickAddFab />
      <SearchCommand />
      {overlays}
    </SidebarProvider>
  );
}
