import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

/** Settings has no page of its own: open the first section. */
export default async function Page({ params }: PageProps<'/[locale]/settings'>) {
  const { locale } = await params;
  redirect({ href: '/settings/profile', locale: locale as Locale });
}
