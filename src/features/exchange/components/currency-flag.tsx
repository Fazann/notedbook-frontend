import 'flag-icons/css/flag-icons.min.css';

import { Globe } from 'lucide-react';

import { cn } from '@/lib/utils';

import { currencyRegion } from '../utils';

export type CurrencyFlagProps = { code: string; className?: string };

/**
 * The flag of a currency's country (SVG from `flag-icons`, loaded only for the flags on screen; emoji flags show as
 * letters on Windows), or a globe for currencies of no single country. Decorative: always show the name next to it.
 */
export function CurrencyFlag({ code, className }: CurrencyFlagProps) {
  const region = currencyRegion(code);
  return (
    <span
      aria-hidden
      className={cn(
        'ring-foreground/10 inline-flex h-4 w-6 shrink-0 items-center justify-center overflow-hidden rounded-[3px]',
        'bg-muted ring-1',
        className
      )}
    >
      {region ? (
        <span className={cn('fi size-full bg-cover bg-center', `fi-${region.toLowerCase()}`)} />
      ) : (
        <Globe className="text-muted-foreground size-3" />
      )}
    </span>
  );
}
