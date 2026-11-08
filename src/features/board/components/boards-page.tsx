'use client';

import { Ellipsis, Plus, SquareKanban } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
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
import { cn } from '@/lib/utils';

import { useBoards, useCreateBoard, useDeleteBoard, useRenameBoard } from '../hooks';
import { BOARD_NAME_MAX, type BoardListItem } from '../types';

import { NameFormDialog } from './name-form-dialog';

/** The user's boards as cards; "New board" starts one with To do / In progress / Done columns. */
export function BoardsPage() {
  const t = useTranslations('board');
  const router = useRouter();
  const boards = useBoards();
  const create = useCreateBoard();
  const [creating, setCreating] = useState(false);

  const createBoard = async (name: string) => {
    try {
      const board = await create.mutateAsync({
        name,
        columns: [t('defaultColumns.todo'), t('defaultColumns.doing'), t('defaultColumns.done')],
      });
      toast.success(t('toast.created'));
      router.push(`/boards/${board.id}`);
    } catch (error) {
      toast.error(t('saveError'));
      throw error;
    }
  };

  const renderList = () => {
    if (boards.isError) return <ErrorState message={t('loadError')} onRetry={() => void boards.refetch()} />;
    if (!boards.data) {
      return (
        <div aria-busy className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      );
    }
    if (boards.data.length === 0) {
      return (
        <Card>
          <EmptyState
            icon={<SquareKanban aria-hidden />}
            title={t('empty')}
            description={t('emptyHint')}
            action={
              <Button size="touch" onClick={() => setCreating(true)}>
                <Plus aria-hidden />
                {t('new')}
              </Button>
            }
          />
        </Card>
      );
    }
    return (
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {boards.data.map((board) => (
          <li key={board.id}>
            <BoardTile board={board} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          boards.data?.length ? (
            <Button size="touch" onClick={() => setCreating(true)}>
              <Plus aria-hidden />
              {t('new')}
            </Button>
          ) : null
        }
      />
      {renderList()}
      <NameFormDialog
        open={creating}
        onOpenChange={setCreating}
        title={t('form.createTitle')}
        label={t('form.name')}
        placeholder={t('form.namePlaceholder')}
        submitLabel={t('form.create')}
        max={BOARD_NAME_MAX}
        onSubmit={createBoard}
      />
    </div>
  );
}

/** One board: the whole tile opens it; "⋯" renames or deletes it (also reachable by tap, never hover-only). */
function BoardTile({ board }: { board: BoardListItem }) {
  const t = useTranslations('board');
  const tCommon = useTranslations('common');
  const rename = useRenameBoard(board.id);
  const remove = useDeleteBoard();
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <Card className="relative min-h-28 gap-1 p-4 transition-colors hover:bg-accent/40">
      <Link
        href={`/boards/${board.id}`}
        className={cn(
          'focus-visible:ring-ring rounded-sm pr-10 outline-none focus-visible:ring-2',
          // The whole tile is the link's click area.
          'after:absolute after:inset-0'
        )}
      >
        <h2 className="leading-relaxed font-semibold break-words">{board.name}</h2>
      </Link>
      <p className="text-muted-foreground text-sm">{t('cardCount', { count: board.card_count })}</p>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-touch" aria-label={t('actions')} className="absolute top-2 right-2 z-10">
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

      <NameFormDialog
        open={renaming}
        onOpenChange={setRenaming}
        title={t('form.renameTitle')}
        label={t('form.name')}
        submitLabel={tCommon('save')}
        initialName={board.name}
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
        title={t('deleteTitle', { name: board.name })}
        description={t('deleteDescription')}
        confirmLabel={t('delete')}
        destructive
        onConfirm={() =>
          remove.mutateAsync(board.id).then(
            () => void toast.success(t('toast.deleted')),
            () => void toast.error(t('saveError'))
          )
        }
      />
    </Card>
  );
}
