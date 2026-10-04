'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SessionGuard } from '@/features/auth/components/session-guard';
import { registerServiceWorker } from '@/lib/service-worker';
import { ApiError } from '@/services/core/api-call';
import { usePreferencesStore } from '@/stores/preferences-store';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            // A 401 means the session is over (SessionGuard goes to /login); retrying cannot help.
            retry: (count, error) => count < 1 && !(error instanceof ApiError && error.status === 401),
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    // Persisted preferences load after hydration so server and client render the same first frame.
    void usePreferencesStore.persist.rehydrate();
    registerServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionGuard />
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          {children}
          <Toaster position="top-center" richColors />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
