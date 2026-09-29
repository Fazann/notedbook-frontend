'use client';

import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/features/auth/hooks';
import { useMounted } from '@/hooks/use-mounted';

import { dayPeriod } from '../utils';

/** "Good evening, Sokha". Rendered after mount because the time of day comes from the browser clock. */
export function Greeting() {
  const t = useTranslations('dashboard.greeting');
  const mounted = useMounted();
  const me = useMe();

  if (!mounted || !me.data) {
    return <Skeleton className="h-8 w-56 md:h-9 md:w-72" />;
  }
  return <>{t(dayPeriod(new Date().getHours()), { name: me.data.fullname })}</>;
}
