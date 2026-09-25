import { useId } from 'react';

import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

export type LocaleFlagProps = { locale: Locale; className?: string };

/**
 * The flag for a UI language, as inline SVG (emoji flags show as letters on Windows). Decorative: always show the
 * language name next to it. Flag colors are fixed by definition, so they are the one place colors are hardcoded.
 */
export function LocaleFlag({ locale, className }: LocaleFlagProps) {
  return (
    <span
      className={cn('inline-flex h-4 w-6 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-foreground/10', className)}
      aria-hidden
    >
      {locale === 'km' ? <CambodiaFlag /> : <UnitedKingdomFlag />}
    </span>
  );
}

function CambodiaFlag() {
  return (
    <svg viewBox="0 0 30 20" className="size-full" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#032EA1" />
      <rect y="5" width="30" height="10" fill="#E00025" />
      {/* Angkor Wat, simplified */}
      <g fill="#FFFFFF">
        <rect x="8.5" y="13" width="13" height="1.2" />
        <rect x="9.5" y="11" width="11" height="2" />
        <polygon points="15,5.8 16.4,11 13.6,11" />
        <polygon points="12.2,7.6 13.3,11 11.1,11" />
        <polygon points="17.8,7.6 18.9,11 16.7,11" />
        <polygon points="10,9 10.8,11 9.2,11" />
        <polygon points="20,9 20.8,11 19.2,11" />
      </g>
    </svg>
  );
}

function UnitedKingdomFlag() {
  // Clip-path ids must be unique when several flags are on the page.
  const id = useId();
  return (
    <svg viewBox="0 0 60 30" className="size-full" preserveAspectRatio="xMidYMid slice">
      <clipPath id={`${id}-s`}>
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id={`${id}-t`}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath={`url(#${id}-s)`}>
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${id}-t)`} stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}
