'use client';

import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type RowAction = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  /** Small text under the label — e.g. why the action is disabled (tooltips don't work on disabled items). */
  description?: React.ReactNode;
};

export type DataListRowActionsProps = { actions: RowAction[]; label?: string };

/** The "⋯" menu for a row or card. Destructive actions are grouped last, after a separator. */
export function DataListRowActions({ actions, label }: DataListRowActionsProps) {
  const t = useTranslations('list');
  const normal = actions.filter((a) => !a.destructive);
  const destructive = actions.filter((a) => a.destructive);

  const renderItem = (a: RowAction) => (
    <DropdownMenuItem
      key={a.id}
      disabled={a.disabled}
      variant={a.destructive ? 'destructive' : 'default'}
      onSelect={a.onSelect}
      className="min-h-10 items-start"
    >
      {a.icon && <span className="mt-0.5 [&_svg]:size-4">{a.icon}</span>}
      <span className="flex flex-col">
        <span>{a.label}</span>
        {a.description && <span className="text-muted-foreground text-xs">{a.description}</span>}
      </span>
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-touch"
          aria-label={label ?? t('moreActions')}
          // Rows can be clickable; opening the menu must not trigger the row.
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-64" onClick={(e) => e.stopPropagation()}>
        {normal.map(renderItem)}
        {normal.length > 0 && destructive.length > 0 && <DropdownMenuSeparator />}
        {destructive.map(renderItem)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
