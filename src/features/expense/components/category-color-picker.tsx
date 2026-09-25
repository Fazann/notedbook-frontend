'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { radioGridKeyDown } from '@/lib/radio-grid';
import { cn } from '@/lib/utils';

import { CATEGORY_COLORS, type CategoryColor } from '../types';
import { CATEGORY_COLOR_CLASSES } from '../utils';

const COLUMNS = 7;

export type CategoryColorPickerProps = {
  value: CategoryColor;
  onChange: (color: CategoryColor) => void;
  'aria-labelledby'?: string;
};

/** Color swatches. The selected one shows a ✓, so color is never the only signal. */
export function CategoryColorPicker({ value, onChange, ...props }: CategoryColorPickerProps) {
  const t = useTranslations('category.colors');
  return (
    <div
      role="radiogroup"
      aria-labelledby={props['aria-labelledby']}
      className="grid grid-cols-7 gap-1.5"
      onKeyDown={(e) => radioGridKeyDown(e, CATEGORY_COLORS, value, COLUMNS, onChange)}
    >
      {CATEGORY_COLORS.map((color) => {
        const checked = color === value;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={t(color)}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(color)}
            className={cn(
              'flex min-h-11 items-center justify-center rounded-lg',
              'focus-visible:ring-ring/50 outline-none focus-visible:ring-3'
            )}
          >
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-full text-primary-foreground',
                CATEGORY_COLOR_CLASSES[color].solid,
                checked && 'ring-foreground ring-offset-background ring-2 ring-offset-2'
              )}
            >
              {checked && <Check className="size-4 drop-shadow" aria-hidden />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
