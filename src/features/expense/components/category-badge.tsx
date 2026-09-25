import { cn } from '@/lib/utils';

import type { Category } from '../types';

import { CategoryIcon } from './category-icon';

export type CategoryBadgeProps = {
  category: Pick<Category, 'icon' | 'color'>;
  /** The display name — pass `getCategoryName(category, t)`. */
  name: string;
  size?: 'sm' | 'md';
  className?: string;
};

/** Icon (in the category color) + name. Used in the categories list, expense rows and the form preview. */
export function CategoryBadge({ category, name, size = 'md', className }: CategoryBadgeProps) {
  return (
    <span className={cn('inline-flex max-w-full min-w-0 items-center gap-2', className)}>
      <CategoryIcon
        icon={category.icon}
        color={category.color}
        className={size === 'sm' ? 'size-6 rounded-md [&_svg]:size-3.5' : undefined}
      />
      <span className={cn('min-w-0 font-medium break-words', size === 'sm' && 'text-xs')}>{name}</span>
    </span>
  );
}
