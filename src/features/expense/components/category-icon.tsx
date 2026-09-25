import {
  Baby,
  Bike,
  BookOpen,
  Bus,
  Car,
  Coffee,
  Dog,
  Dumbbell,
  Ellipsis,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  PiggyBank,
  Pill,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  Smartphone,
  Users,
  Utensils,
  Wifi,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import type { CategoryColor, CategoryIcon as CategoryIconName } from '../types';
import { CATEGORY_COLOR_CLASSES } from '../utils';

export const CATEGORY_ICON_COMPONENTS: Record<CategoryIconName, LucideIcon> = {
  utensils: Utensils,
  coffee: Coffee,
  bike: Bike,
  car: Car,
  bus: Bus,
  home: Home,
  wifi: Wifi,
  smartphone: Smartphone,
  users: Users,
  baby: Baby,
  'shopping-bag': ShoppingBag,
  shirt: Shirt,
  'heart-pulse': HeartPulse,
  pill: Pill,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  gift: Gift,
  plane: Plane,
  'gamepad-2': Gamepad2,
  dumbbell: Dumbbell,
  dog: Dog,
  receipt: Receipt,
  'piggy-bank': PiggyBank,
  ellipsis: Ellipsis,
};

export type CategoryIconProps = { icon: CategoryIconName | undefined; color?: CategoryColor; className?: string };

/** The category's icon in a rounded tile, tinted with its color. Decorative — always show the name as text too. */
export function CategoryIcon({ icon, color, className }: CategoryIconProps) {
  const Icon = icon ? CATEGORY_ICON_COMPONENTS[icon] : Ellipsis;
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg',
        color ? CATEGORY_COLOR_CLASSES[color].soft : 'bg-muted text-muted-foreground',
        className
      )}
      aria-hidden
    >
      <Icon className="size-4" />
    </span>
  );
}
