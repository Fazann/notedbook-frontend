'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

import type { Category } from './types';
import { getCategoryName } from './utils';

/** `getCategoryName` bound to the current locale, for client components. */
export function useCategoryName() {
  const t = useTranslations();
  return useCallback((category: Pick<Category, 'key' | 'name'> | undefined) => getCategoryName(category, t), [t]);
}
