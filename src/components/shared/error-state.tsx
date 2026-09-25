'use client';

import { AlertTriangle, RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ErrorStateProps = React.ComponentProps<'div'> & {
  message: React.ReactNode;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry, className, ...props }: ErrorStateProps) {
  const t = useTranslations('common');
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center gap-3 px-4 py-8 text-center', className)}
      {...props}
    >
      <span className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
        <AlertTriangle className="size-6" aria-hidden />
      </span>
      <p className="text-sm break-words">{message}</p>
      {onRetry && (
        <Button variant="outline" size="lg" onClick={onRetry}>
          <RotateCw aria-hidden />
          {t('retry')}
        </Button>
      )}
    </div>
  );
}
