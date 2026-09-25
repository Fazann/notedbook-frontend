import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render';

import type { Category } from '../types';

import { CategoryDeleteDialog } from './category-delete-dialog';

const base: Category = {
  id: 11,
  key: null,
  name: 'Gym',
  nameKm: '',
  icon: 'dumbbell',
  color: 'green',
  isDefault: false,
  expenseCount: 0,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};
const other: Category = { ...base, id: 10, key: 'other', name: 'Other', isDefault: true, icon: 'ellipsis' };
const food: Category = { ...base, id: 1, key: 'food', name: 'Food', isDefault: true, icon: 'utensils' };
const options = [food, other, base];

describe('CategoryDeleteDialog', () => {
  it('deletes an unused category without asking where to move expenses', () => {
    const onConfirm = vi.fn();
    renderWithIntl(
      <CategoryDeleteDialog category={base} options={options} onOpenChange={() => {}} onConfirm={onConfirm} />
    );
    expect(screen.getByRole('alertdialog', { name: 'Delete “Gym”?' })).toBeInTheDocument();
    expect(screen.getByText("This can't be undone.")).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledWith(undefined);
  });

  it('requires a "move to" category when expenses use it, defaulting to Other', () => {
    const onConfirm = vi.fn();
    renderWithIntl(
      <CategoryDeleteDialog
        category={{ ...base, expenseCount: 3 }}
        options={options}
        onOpenChange={() => {}}
        onConfirm={onConfirm}
      />
    );
    expect(screen.getByText('3 expenses use this category. Move them to:')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Move expenses to' })).toHaveTextContent('Other');
    fireEvent.click(screen.getByRole('button', { name: 'Delete and move' }));
    expect(onConfirm).toHaveBeenCalledWith(10);
  });

  it('cannot confirm without a target category', () => {
    renderWithIntl(
      <CategoryDeleteDialog
        category={{ ...base, expenseCount: 3 }}
        options={[base]}
        onOpenChange={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: 'Delete and move' })).toBeDisabled();
  });

  it('never allows deleting a default category', () => {
    renderWithIntl(
      <CategoryDeleteDialog category={food} options={options} onOpenChange={() => {}} onConfirm={() => {}} />
    );
    expect(screen.getByText("Default categories can't be deleted")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });
});
