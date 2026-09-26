import { Construction } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

/** Body of logged-out pages that are not built yet (register, forgot password): a note and a way back. */
export function AuthNotReady() {
  const t = useTranslations('auth');
  return (
    <EmptyState
      className="py-2"
      icon={<Construction />}
      title={t('notReady')}
      action={
        <Button asChild variant="outline" size="touch" className="w-full">
          <Link href="/login">{t('backToLogin')}</Link>
        </Button>
      }
    />
  );
}
