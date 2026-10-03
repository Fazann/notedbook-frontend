'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

import { ApiError } from '@/services/core/api-call';

/** Maps an error to a translated message: `errors.<code>` if it exists, else the API message, else generic. */
export function useErrorMessage() {
  const t = useTranslations('errors');
  return useCallback(
    (error: unknown): string => {
      if (error instanceof ApiError) {
        if (t.has(error.code)) return t(error.code);
        if (error.message) return error.message;
      }
      return t('generic');
    },
    [t]
  );
}
