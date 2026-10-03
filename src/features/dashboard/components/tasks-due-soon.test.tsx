import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/services/board/board-service';
import { renderWithIntl } from '@/test/render';

import { TasksDueSoon } from './tasks-due-soon';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock('@/services/board/board-service', () => ({ hasBoardData: vi.fn(), listDueCards: vi.fn() }));

describe('TasksDueSoon', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows "coming soon" without loading demo cards when there is no real board data', () => {
    vi.mocked(api.hasBoardData).mockReturnValue(false);
    renderWithIntl(<TasksDueSoon />);
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(api.listDueCards).not.toHaveBeenCalled();
  });

  it('lists the due cards when board data is available', async () => {
    vi.mocked(api.hasBoardData).mockReturnValue(true);
    vi.mocked(api.listDueCards).mockResolvedValue([]);
    renderWithIntl(<TasksDueSoon />);
    expect(await screen.findByText('Nothing due in the next 7 days.')).toBeInTheDocument();
    expect(api.listDueCards).toHaveBeenCalledWith(7);
  });
});
