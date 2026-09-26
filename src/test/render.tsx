import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import en from '../../messages/en.json';
import km from '../../messages/km.json';
import ms from '../../messages/ms.json';

const MESSAGES = { en, km, ms };

type Options = Omit<RenderOptions, 'wrapper'> & { locale?: keyof typeof MESSAGES; queryClient?: QueryClient };

export function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

/** Renders inside NextIntlClientProvider (+ a fresh QueryClient), like the app does. */
export function renderWithIntl(ui: React.ReactElement, { locale = 'en', queryClient, ...options }: Options = {}) {
  const client = queryClient ?? createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="Asia/Phnom_Penh">
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
  return { queryClient: client, ...render(ui, { wrapper: Wrapper, ...options }) };
}
