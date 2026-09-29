'use client';

import { useTranslations } from 'next-intl';

import { ErrorState } from '@/components/shared/error-state';
import { SectionCard } from '@/components/shared/section-card';
import { Skeleton } from '@/components/ui/skeleton';

import { useMe } from '../hooks';

import { AvatarUpload } from './avatar-upload';
import { ProfileForm } from './profile-form';

/** Body of the profile settings page: photo card and personal info card. */
export function ProfileSettings() {
  const t = useTranslations('settings.profile');
  const me = useMe();

  if (me.isPending) {
    return (
      <div className="space-y-4 md:space-y-6" aria-busy>
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }
  if (me.isError) {
    return <ErrorState className="bg-card rounded-xl border" message={t('loadError')} onRetry={() => me.refetch()} />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <SectionCard title={t('photo')}>
        <AvatarUpload user={me.data} />
      </SectionCard>
      <SectionCard title={t('title')} description={t('description')}>
        {/* Keyed by id so a different account never keeps the old form values. */}
        <ProfileForm key={me.data.id} user={me.data} />
      </SectionCard>
    </div>
  );
}
