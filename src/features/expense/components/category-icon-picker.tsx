'use client';

import { useTranslations } from 'next-intl';

import { radioGridKeyDown } from '@/lib/radio-grid';
import { cn } from '@/lib/utils';

import { CATEGORY_ICONS, type CategoryColor, type CategoryIcon } from '../types';
import { CATEGORY_COLOR_CLASSES } from '../utils';

import { CATEGORY_ICON_COMPONENTS } from './category-icon';

const COLUMNS = 6;

export type CategoryIconPickerProps = {
  value: CategoryIcon;
  onChange: (icon: CategoryIcon) => void;
  /** Tints the selected icon, so the picker previews the chosen color. */
  color: CategoryColor;
  'aria-labelledby'?: string;
};

export function CategoryIconPicker({ value, onChange, color, ...props }: CategoryIconPickerProps) {
  const t = useTranslations('category.icons');
  return (
    <div
      role="radiogroup"
      aria-labelledby={props['aria-labelledby']}
      className="grid grid-cols-6 gap-1.5"
      onKeyDown={(e) => radioGridKeyDown(e, CATEGORY_ICONS, value, COLUMNS, onChange)}
    >
      {CATEGORY_ICONS.map((icon) => {
        const Icon = CATEGORY_ICON_COMPONENTS[icon];
        const checked = icon === value;
        return (
          <button
            key={icon}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={t(icon)}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(icon)}
            className={cn(
              'flex aspect-square min-h-11 items-center justify-center rounded-lg border transition-colors',
              'focus-visible:ring-ring/50 outline-none focus-visible:ring-3',
              checked
                ? cn('border-transparent ring-2 ring-current', CATEGORY_COLOR_CLASSES[color].soft)
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Icon className="size-5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
