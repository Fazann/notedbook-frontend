import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/services/board/board-service';
import { renderWithIntl } from '@/test/render';

import { TasksDueSoon } from './tasks-due-soon';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock('@/services/board/board-service', () => ({ listDueCards: vi.fn() }));

describe('TasksDueSoon', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads the cards due in the next 7 days', async () => {
    vi.mocked(api.listDueCards).mockResolvedValue([]);
    renderWithIntl(<TasksDueSoon />);
    expect(await screen.findByText('Nothing due in the next 7 days.')).toBeInTheDocument();
    expect(api.listDueCards).toHaveBeenCalledWith(7);
  });
});
