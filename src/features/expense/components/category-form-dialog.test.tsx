import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/services/api-call';
import * as api from '@/services/expense-service';
import { renderWithIntl } from '@/test/render';

import type { Category } from '../types';

import { CategoryFormDialog } from './category-form-dialog';

vi.mock('@/services/expense-service', () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const gym: Category = {
  id: 11,
  key: null,
  name: 'Gym',
  nameKm: '',
  icon: 'dumbbell',
  color: 'green',
  isDefault: false,
  expenseCount: 2,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};

const nameInput = () => screen.getByRole('textbox', { name: /Name/ });
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('CategoryFormDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows translated validation messages', async () => {
    renderWithIntl(<CategoryFormDialog open onOpenChange={() => {}} />);
    save();
    expect(await screen.findByText('Please enter a name')).toBeInTheDocument();
    expect(api.createCategory).not.toHaveBeenCalled();
  });

  it('shows validation in Khmer', async () => {
    renderWithIntl(<CategoryFormDialog open onOpenChange={() => {}} />, { locale: 'km' });
    fireEvent.click(screen.getByRole('button', { name: 'រក្សាទុក' }));
    expect(await screen.findByText('សូមបញ្ចូលឈ្មោះ')).toBeInTheDocument();
  });

  it('creates a category with the chosen icon and color', async () => {
    vi.mocked(api.createCategory).mockResolvedValue({ ...gym, id: 30, name: 'Books' });
    const onOpenChange = vi.fn();
    renderWithIntl(<CategoryFormDialog open onOpenChange={onOpenChange} />);

    fireEvent.change(nameInput(), { target: { value: 'Books' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Book' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Blue' }));
    expect(screen.getByRole('radio', { name: 'Blue' })).toHaveAttribute('aria-checked', 'true');
    save();

    await waitFor(() =>
      expect(api.createCategory).toHaveBeenCalledWith({ name: 'Books', nameKm: '', icon: 'book-open', color: 'blue' })
    );
    expect(api.updateCategory).not.toHaveBeenCalled();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('updates when editing', async () => {
    vi.mocked(api.updateCategory).mockResolvedValue({ ...gym, name: 'Fitness' });
    renderWithIntl(<CategoryFormDialog open onOpenChange={() => {}} category={gym} />);
    expect(nameInput()).toHaveValue('Gym');
    fireEvent.change(nameInput(), { target: { value: 'Fitness' } });
    save();
    await waitFor(() =>
      expect(api.updateCategory).toHaveBeenCalledWith(11, {
        name: 'Fitness',
        nameKm: '',
        icon: 'dumbbell',
        color: 'green',
      })
    );
    expect(api.createCategory).not.toHaveBeenCalled();
  });

  it('shows the name-taken server error under the name field', async () => {
    vi.mocked(api.createCategory).mockRejectedValue(new ApiError(409, 'CATEGORY_NAME_TAKEN', 'taken'));
    const onOpenChange = vi.fn();
    renderWithIntl(<CategoryFormDialog open onOpenChange={onOpenChange} />);
    fireEvent.change(nameInput(), { target: { value: 'Food' } });
    save();
    expect(await screen.findByText('You already have a category with this name')).toBeInTheDocument();
    expect(nameInput()).toHaveAttribute('aria-invalid', 'true');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('saves an optional Khmer name and previews it in the Khmer UI', async () => {
    vi.mocked(api.createCategory).mockResolvedValue({ ...gym, id: 31, name: 'Rice', nameKm: 'អង្ករ' });
    renderWithIntl(<CategoryFormDialog open onOpenChange={() => {}} />, { locale: 'km' });
    fireEvent.change(screen.getByRole('textbox', { name: /^ឈ្មោះ$/ }), { target: { value: 'Rice' } });
    const khmer = screen.getByRole('textbox', { name: /ឈ្មោះជាភាសាខ្មែរ/ });
    expect(khmer).toHaveAttribute('lang', 'km');
    fireEvent.change(khmer, { target: { value: 'អង្ករ' } });
    expect(screen.getByText('អង្ករ')).toBeInTheDocument(); // preview
    fireEvent.click(screen.getByRole('button', { name: 'រក្សាទុក' }));
    await waitFor(() =>
      expect(api.createCategory).toHaveBeenCalledWith({
        name: 'Rice',
        nameKm: 'អង្ករ',
        icon: 'ellipsis',
        color: 'chart-1',
      })
    );
  });

  it('has no Khmer name field for default categories (they are translated)', () => {
    const food: Category = { ...gym, id: 1, key: 'food', name: 'Food', isDefault: true };
    renderWithIntl(<CategoryFormDialog open onOpenChange={() => {}} category={food} />);
    expect(screen.queryByRole('textbox', { name: /Khmer name/ })).not.toBeInTheDocument();
  });

  it('shows a default category name read-only and translated', () => {
    const food: Category = { ...gym, id: 1, key: 'food', name: 'Food', isDefault: true };
    renderWithIntl(<CategoryFormDialog open onOpenChange={() => {}} category={food} />, { locale: 'km' });
    const input = screen.getByRole('textbox', { name: 'ឈ្មោះ' });
    expect(input).toHaveValue('អាហារ');
    expect(input).toHaveAttribute('readonly');
  });

  it('asks before discarding unsaved changes', async () => {
    const onOpenChange = vi.fn();
    renderWithIntl(<CategoryFormDialog open onOpenChange={onOpenChange} />);
    fireEvent.change(nameInput(), { target: { value: 'Half typed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByRole('alertdialog', { name: 'Discard changes?' })).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
