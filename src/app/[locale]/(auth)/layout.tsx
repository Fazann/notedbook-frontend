import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { cn } from '@/lib/utils';

/** Logged-out pages: one centered card with the language switcher in the corner. */
export default function AuthLayout({ children }: LayoutProps<'/[locale]'>) {
  return (
    <main
      className={cn(
        'bg-muted/40 relative flex min-h-dvh flex-col items-center',
        'px-4 pt-16 pb-8 sm:justify-center sm:pt-8'
      )}
    >
      <LanguageSwitcher showLabel className="absolute top-4 right-4" />
      {children}
    </main>
  );
}
