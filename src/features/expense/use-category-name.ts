'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback } from 'react';

import type { Category } from './types';
import { getCategoryName } from './utils';

/** `getCategoryName` bound to the current locale, for client components. */
export function useCategoryName() {
  const t = useTranslations();
  const locale = useLocale();
  return useCallback(
    (category: Parameters<typeof getCategoryName>[0]) => getCategoryName(category, t, locale),
    [t, locale]
  );
}
