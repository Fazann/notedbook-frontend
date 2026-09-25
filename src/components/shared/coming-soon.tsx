import { Construction } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

import { EmptyState } from './empty-state';
import { PageHeader } from './page-header';

export type ComingSoonProps = {
  title: React.ReactNode;
  /** Section navigation under the header (e.g. tabs). */
  navigation?: React.ReactNode;
};

/** Placeholder for pages that are not built yet in the prototype. */
export function ComingSoon({ title, navigation }: ComingSoonProps) {
  const t = useTranslations('common');
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <PageHeader title={title} />
        {navigation}
      </div>
      <EmptyState
        className="bg-card rounded-xl border py-16"
        icon={<Construction />}
        title={t('comingSoon')}
        description={t('comingSoonDescription')}
        action={
          <Button asChild variant="outline" size="touch">
            <Link href="/dashboard">{t('backToDashboard')}</Link>
          </Button>
        }
      />
    </div>
  );
}
