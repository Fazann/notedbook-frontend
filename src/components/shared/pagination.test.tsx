import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render';

import { Pagination } from './pagination';

const meta = (page: number, total: number, pageSize = 10) => ({
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize),
});

describe('Pagination', () => {
  it('renders nothing when there are no items', () => {
    const { container } = renderWithIntl(<Pagination meta={meta(1, 0)} onPageChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the range, the current page and ellipses', () => {
    renderWithIntl(<Pagination meta={meta(5, 120)} onPageChange={() => {}} />);
    expect(screen.getByText('Showing 41–50 of 120')).toBeInTheDocument();
    expect(screen.getByText('Page 5 of 12')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 5' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Go to page 4' })).not.toHaveAttribute('aria-current');
    expect(screen.getAllByText('…')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Go to page 2' })).not.toBeInTheDocument();
  });

  it('disables Previous on the first page and Next on the last', () => {
    const { rerender } = renderWithIntl(<Pagination meta={meta(1, 30)} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    rerender(<Pagination meta={meta(3, 30)} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('hides page numbers when there is only one page', () => {
    renderWithIntl(<Pagination meta={meta(1, 4)} onPageChange={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Go to page 1' })).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1–4 of 4')).toBeInTheDocument();
  });

  it('calls onPageChange', () => {
    const onPageChange = vi.fn();
    renderWithIntl(<Pagination meta={meta(2, 30)} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go to page 1' }));
    expect(onPageChange.mock.calls).toEqual([[3], [1]]);
  });

  it('renders in Khmer', () => {
    renderWithIntl(<Pagination meta={meta(2, 30)} onPageChange={() => {}} />, { locale: 'km' });
    expect(screen.getByRole('navigation', { name: 'ការបែងចែកទំព័រ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'បន្ទាប់' })).toBeInTheDocument();
  });
});
