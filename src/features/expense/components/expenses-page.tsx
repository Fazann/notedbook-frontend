'use client';

import { differenceInCalendarDays } from 'date-fns';
import { Pencil, Plus, Receipt, SearchX, Trash2 } from 'lucide-react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataList, type DataListColumn } from '@/components/shared/data-list';
import type { RowAction } from '@/components/shared/data-list-row-actions';
import { EmptyState } from '@/components/shared/empty-state';
import { ListPage } from '@/components/shared/list-page';
import { ListToolbar } from '@/components/shared/list-toolbar';
import { MoneyText } from '@/components/shared/money-text';
import { MonthPicker } from '@/components/shared/month-picker';
import { OptionSelect } from '@/components/shared/option-select';
import { Pagination } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { useErrorMessage } from '@/hooks/use-error-message';
import { useListParams } from '@/hooks/use-list-params';
import { currentMonth, parseDate, utcDate } from '@/lib/dates';
import { CURRENCIES, formatMoney } from '@/lib/money';

import { useCategoryOptions, useCreateExpense, useDeleteExpense, useExpenseList } from '../hooks';
import { EXPENSE_DEFAULT_SORT, EXPENSE_FILTER_KEYS, EXPENSE_SORT_KEYS, type Expense } from '../types';
import { useCategoryName } from '../use-category-name';
import { parseExpenseFilters } from '../utils';

import { CategoryBadge } from './category-badge';
import { ExpenseFormDialog } from './expense-form-dialog';
import { ExpenseSummary } from './expense-summary';
import { ExpenseTabs } from './expense-tabs';

const SORT_OPTIONS = [
  { value: '-spent_at', key: 'newest' },
  { value: 'spent_at', key: 'oldest' },
  { value: '-amount', key: 'amountDesc' },
  { value: 'amount', key: 'amountAsc' },
] as const;

/** Radix Select can't use '' as an item value, so "all" stands for "no filter". */
const ALL = 'all';

export function ExpensesPage() {
  const t = useTranslations('expense');
  const tc = useTranslations('common');
  const tList = useTranslations('list');
  const tCurrency = useTranslations('currency');
  const locale = useLocale();
  const format = useFormatter();
  const errorMessage = useErrorMessage();
  const categoryName = useCategoryName();
  const list = useListParams({
    defaultSort: EXPENSE_DEFAULT_SORT,
    sortKeys: EXPENSE_SORT_KEYS,
    filterKeys: EXPENSE_FILTER_KEYS,
  });
  const { params, setPage, setFilter } = list;
  const thisMonth = currentMonth();
  const filters = parseExpenseFilters(list.filters, thisMonth);
  const query = useExpenseList({ ...params, ...filters });
  const categories = useCategoryOptions();
  const remove = useDeleteExpense();
  const create = useCreateExpense();
  const listTopRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<{ open: boolean; expense?: Expense }>({ open: false });
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const meta = query.data?.meta;
  // After a delete the current page can end up past the last one: go back to the last page.
  useEffect(() => {
    if (meta && meta.totalPages > 0 && params.page > meta.totalPages) setPage(meta.totalPages);
  }, [meta, params.page, setPage]);

  const categoryById = useMemo(() => new Map(categories.data?.map((c) => [c.id, c])), [categories.data]);
  const categoryOf = (expense: Expense) => categoryById.get(expense.category_id);

  const shortDate = (date: string) =>
    format.dateTime(utcDate(date), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const dayLabel = (date: string) => {
    const diff = differenceInCalendarDays(new Date(), parseDate(date));
    if (diff === 0) return tc('today');
    if (diff === 1) return tc('yesterday');
    return shortDate(date);
  };

  const openAdd = () => setForm({ open: true });
  const openEdit = (expense: Expense) => setForm({ open: true, expense });

  const confirmDelete = () => {
    if (!deleting) return;
    const { id, amount, currency, category_id, note, spent_at } = deleting;
    setDeleting(null); // optimistic: the row is already gone from the list
    remove.mutate(id, {
      onSuccess: () =>
        toast.success(t('deleted'), {
          action: {
            label: t('undo'),
            onClick: () =>
              create.mutate(
                { amount, currency, category_id, note, spent_at },
                {
                  onSuccess: () => toast.success(t('restored')),
                  onError: (error) => toast.error(errorMessage(error)),
                }
              ),
          },
        }),
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  const rowActions = (expense: Expense): RowAction[] => [
    { id: 'edit', label: tc('edit'), icon: <Pencil />, onSelect: () => openEdit(expense) },
    {
      id: 'delete',
      label: tc('delete'),
      icon: <Trash2 />,
      destructive: true,
      onSelect: () => setDeleting(expense),
    },
  ];

  const amountText = (expense: Expense) => (
    <MoneyText amount={expense.amount} currency={expense.currency} negative className="font-medium" />
  );

  const columns: DataListColumn<Expense>[] = [
    {
      id: 'date',
      header: t('columns.date'),
      sortKey: 'spent_at',
      className: 'w-36',
      cell: (e) => <span className="text-muted-foreground">{shortDate(e.spent_at)}</span>,
    },
    {
      id: 'category',
      header: t('columns.category'),
      className: 'w-48',
      cell: (e) => {
        const category = categoryOf(e);
        return category ? <CategoryBadge category={category} name={categoryName(category)} size="sm" /> : null;
      },
    },
    {
      id: 'note',
      header: t('columns.note'),
      cell: (e) =>
        e.note ? (
          <span className="break-words">{e.note}</span>
        ) : (
          <span className="text-muted-foreground">{t('noNote')}</span>
        ),
    },
    { id: 'amount', header: t('columns.amount'), sortKey: 'amount', align: 'end', className: 'w-36', cell: amountText },
  ];

  const addButton = (
    <Button size="touch" onClick={openAdd} aria-label={t('add')}>
      <Plus aria-hidden />
      <span className="hidden sm:inline">{t('add')}</span>
    </Button>
  );

  const hasFilters = params.search !== '' || filters.categoryId !== undefined || filters.currency !== undefined;
  const clearFilters = () => list.clearFilters(['category', 'currency']);

  const categoryOptions = [
    { value: ALL, label: t('filters.allCategories') },
    ...(categories.data ?? []).map((c) => ({ value: String(c.id), label: categoryName(c) })),
  ];
  const currencyOptions = [
    { value: ALL, label: t('filters.allCurrencies') },
    ...CURRENCIES.map((c) => ({ value: c, label: tCurrency(c) })),
  ];

  const deletingCategory = deleting ? categoryOf(deleting) : undefined;
  // Phone cards are grouped under day headings only while the list is ordered by date.
  const groupByDay = params.sort?.endsWith('spent_at') ?? false;

  return (
    <ListPage
      title={t('title')}
      description={t('description')}
      primaryAction={addButton}
      navigation={<ExpenseTabs />}
      summary={<ExpenseSummary month={filters.month} />}
      toolbar={
        <ListToolbar
          search={list.searchInput}
          onSearchChange={list.setSearch}
          onSearchClear={list.clearSearch}
          searchPlaceholder={t('searchPlaceholder')}
          filters={
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <MonthPicker
                className="col-span-2"
                value={filters.month}
                max={thisMonth}
                onChange={(month) => setFilter('month', month === thisMonth ? '' : month)}
              />
              <OptionSelect
                options={categoryOptions}
                value={filters.categoryId === undefined ? ALL : String(filters.categoryId)}
                onValueChange={(v) => setFilter('category', v === ALL ? '' : v)}
                aria-label={t('filters.category')}
                className="sm:w-44"
              />
              <OptionSelect
                options={currencyOptions}
                value={filters.currency ?? ALL}
                onValueChange={(v) => setFilter('currency', v === ALL ? '' : v)}
                aria-label={t('filters.currency')}
                className="sm:w-40"
              />
            </div>
          }
          actions={
            <OptionSelect
              options={SORT_OPTIONS.map((o) => ({ value: o.value, label: t(`sort.${o.key}`) }))}
              value={params.sort}
              onValueChange={list.setSort}
              placeholder={tList('sortBy')}
              aria-label={tList('sortBy')}
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
          getRowId={(e) => e.id}
          rowActions={rowActions}
          onRowClick={openEdit}
          sort={params.sort}
          onSortChange={list.setSort}
          isLoading={query.isPending}
          isFetching={query.isPlaceholderData}
          isError={query.isError}
          onRetry={() => void query.refetch()}
          errorMessage={t('loadError')}
          isFiltered={hasFilters}
          skeletonCount={params.pageSize}
          caption={t('title')}
          noResultsState={
            <EmptyState
              icon={<SearchX />}
              title={params.search ? tList('noResults', { query: params.search }) : t('filters.noMatch')}
              action={
                <Button variant="outline" size="touch" onClick={clearFilters}>
                  {t('filters.clear')}
                </Button>
              }
            />
          }
          emptyState={
            <EmptyState
              icon={<Receipt />}
              title={t('empty.title')}
              description={t('empty.description')}
              action={
                <Button size="touch" onClick={openAdd}>
                  <Plus aria-hidden />
                  {t('empty.action')}
                </Button>
              }
            />
          }
          getMobileGroup={groupByDay ? (e) => ({ id: e.spent_at, label: dayLabel(e.spent_at) }) : undefined}
          renderMobileItem={(e) => {
            const category = categoryOf(e);
            return (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium break-words">{e.note || (category && categoryName(category))}</p>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    {category && <CategoryBadge category={category} name={categoryName(category)} size="sm" />}
                    {!groupByDay && <span>{shortDate(e.spent_at)}</span>}
                  </div>
                </div>
                <span className="shrink-0 pt-0.5 text-sm">{amountText(e)}</span>
              </div>
            );
          }}
        />
      </div>

      <ExpenseFormDialog
        open={form.open}
        expense={form.expense}
        onOpenChange={(open) => !open && setForm({ open: false })}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('deleteDialog.title')}
        description={
          deleting &&
          t('deleteDialog.description', {
            amount: formatMoney(deleting.amount, deleting.currency, locale),
            category: categoryName(deletingCategory),
            date: shortDate(deleting.spent_at),
          })
        }
        confirmLabel={t('deleteDialog.confirm')}
        onConfirm={confirmDelete}
        destructive
      />
    </ListPage>
  );
}
