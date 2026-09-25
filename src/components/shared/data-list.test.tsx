import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render';

import { DataList, type DataListBaseProps, type DataListTableProps } from './data-list';

type Item = { id: number; name: string };

const columns = [{ id: 'name', header: 'Name', sortKey: 'name', cell: (i: Item) => i.name }];

function renderList(props: Partial<DataListBaseProps<Item> & DataListTableProps<Item>>) {
  return renderWithIntl(
    <DataList<Item>
      items={undefined}
      columns={columns}
      getRowId={(i) => i.id}
      renderMobileItem={(i) => <span>{i.name} (mobile)</span>}
      emptyState={<p>Nothing here yet</p>}
      {...props}
    />
  );
}

describe('DataList', () => {
  it('shows skeleton rows while loading', () => {
    const { container } = renderList({ isLoading: true, skeletonCount: 3 });
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('shows the empty state when there is no data', () => {
    renderList({ items: [] });
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('shows "no results" with a clear button when filtered', () => {
    const onClearSearch = vi.fn();
    renderList({ items: [], isFiltered: true, searchQuery: 'xyz', onClearSearch });
    expect(screen.getByText('No results for “xyz”')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onClearSearch).toHaveBeenCalled();
  });

  it('shows an error with retry', () => {
    const onRetry = vi.fn();
    renderList({ isError: true, onRetry, errorMessage: 'Could not load things' });
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load things');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders rows (table) and cards (phone), with sortable headers', () => {
    const onSortChange = vi.fn();
    renderList({ items: [{ id: 1, name: 'Gym' }], sort: 'name', onSortChange });
    const table = screen.getByRole('table');
    expect(within(table).getByText('Gym')).toBeInTheDocument();
    expect(screen.getByText('Gym (mobile)')).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
    fireEvent.click(within(table).getByRole('button', { name: /Name/ }));
    expect(onSortChange).toHaveBeenCalledWith('-name');
  });

  it('opens the row actions menu', async () => {
    const onEdit = vi.fn();
    renderList({
      items: [{ id: 1, name: 'Gym' }],
      rowActions: () => [
        { id: 'edit', label: 'Edit', onSelect: onEdit },
        { id: 'delete', label: 'Delete', onSelect: () => {}, destructive: true, disabled: true },
      ],
    });
    const trigger = within(screen.getByRole('table')).getByRole('button', { name: 'More actions' });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Delete' })).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalled();
  });

  describe('grid layout', () => {
    const renderGrid = (props: Partial<DataListBaseProps<Item>>) =>
      renderWithIntl(
        <DataList<Item>
          layout="grid"
          items={undefined}
          getRowId={(i) => i.id}
          renderGridItem={(i) => <article>{i.name} card</article>}
          emptyState={<p>Nothing here yet</p>}
          aria-label="Cards"
          {...props}
        />
      );

    it('renders one card per item, with no table', () => {
      const { container } = renderGrid({
        items: [
          { id: 1, name: 'Gym' },
          { id: 2, name: 'Books' },
        ],
      });
      const list = screen.getByRole('list', { name: 'Cards' });
      expect(within(list).getAllByRole('listitem')).toHaveLength(2);
      expect(screen.getByText('Gym card')).toBeInTheDocument();
      expect(container.querySelector('table')).not.toBeInTheDocument();
    });

    it('shows at most 6 skeleton cards while loading', () => {
      const { container } = renderGrid({ isLoading: true, skeletonCount: 12 });
      expect(container.querySelectorAll('li[aria-hidden]')).toHaveLength(6);
    });

    it('keeps the empty, no-results and error states', () => {
      const { rerender } = renderGrid({ items: [] });
      expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
      rerender(
        <DataList<Item>
          layout="grid"
          items={undefined}
          getRowId={(i) => i.id}
          renderGridItem={(i) => i.name}
          emptyState={null}
          isError
          errorMessage="Could not load cards"
        />
      );
      expect(screen.getByRole('alert')).toHaveTextContent('Could not load cards');
    });
  });
});
