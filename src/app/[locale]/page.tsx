import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export default async function LocaleHome({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  // Logged-out users never get here: proxy.ts sends them to /login.
  redirect({ href: '/dashboard', locale: routing.locales.find((l) => l === locale) ?? routing.defaultLocale });
}
