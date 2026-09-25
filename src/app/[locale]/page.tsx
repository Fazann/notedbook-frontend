import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export default async function LocaleHome({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  // TODO(api): send logged-out users to /login once real auth exists.
  redirect({ href: '/dashboard', locale: routing.locales.find((l) => l === locale) ?? routing.defaultLocale });
}
