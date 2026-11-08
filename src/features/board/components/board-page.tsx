'use client';

import { ChevronLeft, Ellipsis } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useRouter } from '@/i18n/navigation';

import { useBoard, useDeleteBoard, useRenameBoard } from '../hooks';
import { BOARD_NAME_MAX } from '../types';

import { KanbanBoard } from './kanban-board';
import { NameFormDialog } from './name-form-dialog';

export type BoardPageProps = { boardId: number };

export function BoardPage({ boardId }: BoardPageProps) {
  const t = useTranslations('board');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const board = useBoard(boardId);
  const rename = useRenameBoard(boardId);
  const remove = useDeleteBoard();
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const back = (
    <Button asChild variant="ghost" size="touch" className="text-muted-foreground -ml-2">
      <Link href="/boards">
        <ChevronLeft aria-hidden />
        {t('back')}
      </Link>
    </Button>
  );

  if (board.isError) {
    return (
      <div className="space-y-4">
        {back}
        <Card>
          <ErrorState message={t('boardLoadError')} onRetry={() => void board.refetch()} />
        </Card>
      </div>
    );
  }

  if (!board.data) {
    return (
      <div aria-busy className="space-y-4">
        {back}
        <Skeleton className="h-9 w-56" />
        <div className="flex gap-3 overflow-hidden md:gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-72 w-[85vw] max-w-sm shrink-0 rounded-xl md:w-72" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {back}
      <div className="flex items-start gap-2">
        <h1 className="font-heading min-w-0 flex-1 text-2xl font-semibold break-words md:text-3xl">
          {board.data.name}
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-touch" aria-label={t('actions')}>
              <Ellipsis aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="min-h-11" onSelect={() => setRenaming(true)}>
              {t('rename')}
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11" variant="destructive" onSelect={() => setDeleting(true)}>
              {t('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <KanbanBoard board={board.data} />

      <NameFormDialog
        open={renaming}
        onOpenChange={setRenaming}
        title={t('form.renameTitle')}
        label={t('form.name')}
        submitLabel={tCommon('save')}
        initialName={board.data.name}
        max={BOARD_NAME_MAX}
        onSubmit={(name) =>
          rename.mutateAsync(name).catch((error: unknown) => {
            toast.error(t('saveError'));
            throw error;
          })
        }
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t('deleteTitle', { name: board.data.name })}
        description={t('deleteDescription')}
        confirmLabel={t('delete')}
        destructive
        onConfirm={async () => {
          try {
            await remove.mutateAsync(boardId);
            toast.success(t('toast.deleted'));
            router.push('/boards');
          } catch {
            toast.error(t('saveError'));
          }
        }}
      />
    </div>
  );
}
