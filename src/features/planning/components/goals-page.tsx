'use client';

import { Plus, SearchX, Target, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { DataList } from '@/components/shared/data-list';
import { EmptyState } from '@/components/shared/empty-state';
import { ListPage } from '@/components/shared/list-page';
import { ListToolbar } from '@/components/shared/list-toolbar';
import { MultiSelect } from '@/components/shared/multi-select';
import { OptionSelect } from '@/components/shared/option-select';
import { Pagination } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useListParams } from '@/hooks/use-list-params';

import { useGoals } from '../hooks';
import {
  GOAL_AREAS,
  GOAL_DEFAULT_PAGE_SIZE,
  GOAL_DEFAULT_SORT,
  GOAL_DEFAULT_STATUS_FILTER,
  GOAL_FILTER_KEYS,
  GOAL_PAGE_SIZE_OPTIONS,
  GOAL_SORT_KEYS,
  GOAL_STATUS_FILTERS,
  type GoalSummary,
} from '../types';
import { useGoalActions } from '../use-goal-actions';
import { parseGoalFilters } from '../utils';

import { GOAL_AREA_CLASSES, GOAL_AREA_ICONS } from './goal-area-badge';
import { GoalCard } from './goal-card';
import { GoalDeleteDialog } from './goal-delete-dialog';
import { GoalFormDialog } from './goal-form-dialog';
import { GoalStats } from './goal-stats';

const SORT_OPTIONS = [
  { value: 'targetDate', key: 'dueSoonest' },
  { value: '-createdAt', key: 'newest' },
  { value: '-progress', key: 'mostProgress' },
  { value: 'title', key: 'title' },
] as const;

export function GoalsPage() {
  const t = useTranslations('planning');
  const tList = useTranslations('list');
  const list = useListParams({
    defaultSort: GOAL_DEFAULT_SORT,
    sortKeys: GOAL_SORT_KEYS,
    filterKeys: GOAL_FILTER_KEYS,
    pageSizeOptions: GOAL_PAGE_SIZE_OPTIONS,
    defaultPageSize: GOAL_DEFAULT_PAGE_SIZE,
  });
  const { params, setPage, setFilter } = list;
  const filters = parseGoalFilters(list.filters);
  const query = useGoals({ ...params, ...filters });
  const listTopRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<{ open: boolean; goalId?: number }>({ open: false });
  const [deleting, setDeleting] = useState<GoalSummary | null>(null);

  const meta = query.data?.meta;
  // After a delete (or a status change that moves a goal to another tab) the page can end up past the last one.
  useEffect(() => {
    if (meta && meta.totalPages > 0 && params.page > meta.totalPages) setPage(meta.totalPages);
  }, [meta, params.page, setPage]);

  const openCreate = () => setForm({ open: true });
  const goalActions = useGoalActions({
    onEdit: (goal) => setForm({ open: true, goalId: goal.id }),
    onDelete: setDeleting,
  });

  const newGoalButton = (
    <Button size="touch" onClick={openCreate} aria-label={t('newGoal')}>
      <Plus aria-hidden />
      <span className="hidden sm:inline">{t('newGoal')}</span>
    </Button>
  );

  const isFiltered = params.search !== '' || filters.areas.length > 0;
  const emptyState =
    filters.status === 'done' ? (
      <EmptyState icon={<Trophy />} title={t('empty.doneTitle')} description={t('empty.doneDescription')} />
    ) : (
      <EmptyState
        icon={<Target />}
        title={t('empty.title')}
        description={t('empty.description')}
        action={
          <Button size="touch" onClick={openCreate}>
            <Plus aria-hidden />
            {t('newGoal')}
          </Button>
        }
      />
    );

  return (
    <ListPage
      title={t('title')}
      description={t('description')}
      primaryAction={newGoalButton}
      summary={<GoalStats />}
      toolbar={
        <ListToolbar
          search={list.searchInput}
          onSearchChange={list.setSearch}
          onSearchClear={list.clearSearch}
          searchPlaceholder={t('searchPlaceholder')}
          leading={
            <ToggleGroup
              type="single"
              variant="outline"
              size="touch"
              spacing={0}
              value={filters.status}
              onValueChange={(v) => v && setFilter('status', v === GOAL_DEFAULT_STATUS_FILTER ? '' : v)}
              aria-label={t('filters.status')}
              className="w-full sm:w-auto"
            >
              {GOAL_STATUS_FILTERS.map((status) => (
                <ToggleGroupItem key={status} value={status} className="flex-1 sm:flex-none">
                  {t(`tabs.${status}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          }
          filters={
            <MultiSelect
              options={GOAL_AREAS.map((area) => {
                const Icon = GOAL_AREA_ICONS[area];
                return {
                  value: area,
                  label: t(`area.${area}`),
                  icon: <Icon className={GOAL_AREA_CLASSES[area].icon} aria-hidden />,
                };
              })}
              value={filters.areas}
              onChange={(areas) => setFilter('area', areas.join(','))}
              placeholder={t('filters.allAreas')}
              selectedLabel={(count) => t('filters.areaCount', { count })}
              aria-label={t('filters.area')}
              className="sm:w-44"
            />
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
            pageSizeOptions={GOAL_PAGE_SIZE_OPTIONS}
            disabled={query.isPlaceholderData}
            scrollTargetRef={listTopRef}
          />
        )
      }
    >
      <div ref={listTopRef} className="scroll-mt-20">
        <DataList
          layout="grid"
          items={query.data?.data}
          getRowId={(goal) => goal.id}
          renderGridItem={(goal) => <GoalCard goal={goal} actions={goalActions(goal)} />}
          aria-label={t('title')}
          isLoading={query.isPending}
          isFetching={query.isPlaceholderData}
          isError={query.isError}
          onRetry={() => void query.refetch()}
          errorMessage={t('loadError')}
          isFiltered={isFiltered}
          skeletonCount={6}
          emptyState={emptyState}
          noResultsState={
            <EmptyState
              icon={<SearchX />}
              title={params.search ? tList('noResults', { query: params.search }) : t('filters.noMatch')}
              action={
                <Button variant="outline" size="touch" onClick={() => list.clearFilters(['area'])}>
                  {t('filters.clear')}
                </Button>
              }
            />
          }
        />
      </div>

      <GoalFormDialog
        open={form.open}
        goalId={form.goalId}
        onOpenChange={(open) => !open && setForm({ open: false })}
      />
      <GoalDeleteDialog goal={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </ListPage>
  );
}
