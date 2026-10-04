import { Container } from '@/components/layout/container';
import { HelpHeader } from '@/features/help/components/help-header';

/** Public help pages: open to everyone, signed in or not (see PUBLIC_PATHS). */
export default function HelpLayout({ children }: LayoutProps<'/[locale]/help'>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <HelpHeader />
      <main className="flex-1 py-6 pb-[max(2rem,env(safe-area-inset-bottom))] md:py-10">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
