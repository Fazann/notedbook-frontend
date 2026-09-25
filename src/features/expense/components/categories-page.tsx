'use client';

import { Eye, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { DataList, type DataListColumn } from '@/components/shared/data-list';
import type { RowAction } from '@/components/shared/data-list-row-actions';
import { EmptyState } from '@/components/shared/empty-state';
import { ListPage } from '@/components/shared/list-page';
import { ListToolbar } from '@/components/shared/list-toolbar';
import { OptionSelect } from '@/components/shared/option-select';
import { Pagination } from '@/components/shared/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useListParams } from '@/hooks/use-list-params';
import { Link, useRouter } from '@/i18n/navigation';

import { useCategories, useCategoryOptions, useDeleteCategory } from '../hooks';
import { CATEGORY_SORT_KEYS, type Category } from '../types';
import { categoryErrorMessage, getCategoryName } from '../utils';

import { CategoryBadge } from './category-badge';
import { CategoryDeleteDialog } from './category-delete-dialog';
import { CategoryFormDialog } from './category-form-dialog';
import { ExpenseTabs } from './expense-tabs';

const SORT_OPTIONS = [
  { value: 'name', key: 'nameAsc' },
  { value: '-name', key: 'nameDesc' },
  { value: '-expenseCount', key: 'mostUsed' },
  { value: '-createdAt', key: 'newest' },
] as const;

export function CategoriesPage() {
  const t = useTranslations();
  const format = useFormatter();
  const router = useRouter();
  const list = useListParams({ defaultSort: 'name', sortKeys: CATEGORY_SORT_KEYS });
  const { params, setPage } = list;
  const query = useCategories(params);
  const options = useCategoryOptions();
  const remove = useDeleteCategory();
  const listTopRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<{ open: boolean; category?: Category }>({ open: false });
  const [deleting, setDeleting] = useState<Category | null>(null);

  const meta = query.data?.meta;
  // After a delete the current page can end up past the last one: go back to the last page.
  useEffect(() => {
    if (meta && meta.totalPages > 0 && params.page > meta.totalPages) setPage(meta.totalPages);
  }, [meta, params.page, setPage]);

  const name = (c: Category) => getCategoryName(c, t);
  const openEdit = (category: Category) => setForm({ open: true, category });
  const viewExpenses = (category: Category) =>
    router.push({ pathname: '/expenses', query: { category: String(category.id) } });

  const confirmDelete = (reassignTo: number | undefined) => {
    if (!deleting) return;
    const id = deleting.id;
    setDeleting(null); // optimistic: the row is already gone from the list
    remove.mutate(
      { id, reassignTo },
      {
        onSuccess: () => toast.success(t('category.toast.deleted')),
        onError: (error) => toast.error(categoryErrorMessage(error, t)),
      }
    );
  };

  const rowActions = (category: Category): RowAction[] => [
    { id: 'edit', label: t('category.edit'), icon: <Pencil />, onSelect: () => openEdit(category) },
    { id: 'view', label: t('category.viewExpenses'), icon: <Eye />, onSelect: () => viewExpenses(category) },
    {
      id: 'delete',
      label: t('category.delete'),
      icon: <Trash2 />,
      destructive: true,
      disabled: category.isDefault,
      description: category.isDefault ? t('category.defaultCannotDelete') : undefined,
      onSelect: () => setDeleting(category),
    },
  ];

  const defaultBadge = (category: Category) =>
    category.isDefault && (
      <Badge variant="secondary" className="h-auto">
        {t('category.defaultBadge')}
      </Badge>
    );

  const columns: DataListColumn<Category>[] = [
    {
      id: 'name',
      header: t('category.columns.name'),
      sortKey: 'name',
      cell: (c) => (
        <span className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={c} name={name(c)} />
          {defaultBadge(c)}
        </span>
      ),
    },
    {
      id: 'expenses',
      header: t('category.columns.expenses'),
      sortKey: 'expenseCount',
      align: 'end',
      className: 'w-32',
      cell: (c) => (
        <Link
          href={{ pathname: '/expenses', query: { category: String(c.id) } }}
          onClick={(e) => e.stopPropagation()}
          className="tabular-nums underline-offset-4 hover:underline"
        >
          {format.number(c.expenseCount)}
        </Link>
      ),
    },
    {
      id: 'created',
      header: t('category.columns.created'),
      sortKey: 'createdAt',
      className: 'w-40',
      cell: (c) => (
        <span className="text-muted-foreground">
          {format.dateTime(new Date(c.createdAt), { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
  ];

  const addButton = (
    <Button size="touch" onClick={() => setForm({ open: true })} aria-label={t('category.add')}>
      <Plus aria-hidden />
      <span className="hidden sm:inline">{t('category.add')}</span>
    </Button>
  );

  return (
    <ListPage
      title={t('category.title')}
      description={t('category.description')}
      primaryAction={addButton}
      navigation={<ExpenseTabs />}
      toolbar={
        <ListToolbar
          search={list.searchInput}
          onSearchChange={list.setSearch}
          onSearchClear={list.clearSearch}
          searchPlaceholder={t('category.searchPlaceholder')}
          actions={
            <OptionSelect
              options={SORT_OPTIONS.map((o) => ({ value: o.value, label: t(`category.sort.${o.key}`) }))}
              value={params.sort}
              onValueChange={list.setSort}
              placeholder={t('list.sortBy')}
              aria-label={t('list.sortBy')}
              align="end"
              className="sm:w-44"
            />
          }
        />
      }
      pagination={
        meta && (
          <Pagination
            meta={meta}
            onPageChange={setPage}
            onPageSizeChange={list.setPageSize}
            disabled={query.isPlaceholderData}
            scrollTargetRef={listTopRef}
          />
        )
      }
    >
      <div ref={listTopRef} className="scroll-mt-20">
        <DataList
          items={query.data?.data}
          columns={columns}
          getRowId={(c) => c.id}
          rowActions={rowActions}
          onRowClick={openEdit}
          sort={params.sort}
          onSortChange={list.setSort}
          isLoading={query.isPending}
          isFetching={query.isPlaceholderData}
          isError={query.isError}
          onRetry={() => void query.refetch()}
          errorMessage={t('category.loadError')}
          isFiltered={params.search !== ''}
          searchQuery={params.search}
          onClearSearch={list.clearSearch}
          skeletonCount={params.pageSize}
          caption={t('category.title')}
          emptyState={
            <EmptyState
              icon={<Tags />}
              title={t('category.empty.title')}
              description={t('category.empty.description')}
              action={
                <Button size="touch" onClick={() => setForm({ open: true })}>
                  <Plus aria-hidden />
                  {t('category.add')}
                </Button>
              }
            />
          }
          renderMobileItem={(c) => (
            <div className="space-y-1">
              <span className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={c} name={name(c)} />
                {defaultBadge(c)}
              </span>
              <p className="text-muted-foreground text-sm">{t('category.expenseCount', { count: c.expenseCount })}</p>
            </div>
          )}
        />
      </div>

      <CategoryFormDialog
        open={form.open}
        category={form.category}
        onOpenChange={(open) => !open && setForm({ open: false })}
      />
      <CategoryDeleteDialog
        category={deleting}
        options={options.data ?? []}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </ListPage>
  );
}
