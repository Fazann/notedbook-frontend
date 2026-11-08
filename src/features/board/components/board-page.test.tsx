import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, renderHook, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { qk } from '@/lib/query-keys';
import * as api from '@/services/board/board-service';
import { createTestQueryClient, renderWithIntl } from '@/test/render';

import { useMoveCard } from '../hooks';
import type { Board } from '../types';

import { BoardPage } from './board-page';
import { BoardsPage } from './boards-page';

vi.mock('@/services/board/board-service', () => ({
  listBoards: vi.fn(),
  getBoard: vi.fn(),
  createBoard: vi.fn(),
  renameBoard: vi.fn(),
  deleteBoard: vi.fn(),
  createColumn: vi.fn(),
  renameColumn: vi.fn(),
  deleteColumn: vi.fn(),
  createCard: vi.fn(),
  updateCard: vi.fn(),
  moveCard: vi.fn(),
  deleteCard: vi.fn(),
  listDueCards: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const push = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push }),
  Link: ({ href, children, ...props }: React.ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const board = (): Board => ({
  id: 1,
  name: 'Trip',
  columns: [
    {
      id: 10,
      board_id: 1,
      name: 'To do',
      position: 1000,
      cards: [
        {
          id: 1,
          column_id: 10,
          title: 'Book flights',
          description: 'Before Friday',
          due_date: '2020-01-01',
          label: 'red',
          position: 1000,
        },
      ],
    },
    { id: 30, board_id: 1, name: 'Done', position: 2000, cards: [] },
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getBoard).mockResolvedValue(board());
});

describe('BoardsPage', () => {
  it('creates a board with translated default columns and opens it', async () => {
    vi.mocked(api.listBoards).mockResolvedValue([]);
    vi.mocked(api.createBoard).mockResolvedValue({ ...board(), id: 5 });
    renderWithIntl(<BoardsPage />, { locale: 'km' });

    fireEvent.click(await screen.findByRole('button', { name: 'ក្ដារថ្មី' }));
    fireEvent.change(screen.getByLabelText(/ឈ្មោះ/), { target: { value: '  Trip ' } });
    fireEvent.click(screen.getByRole('button', { name: 'បង្កើតក្ដារ' }));

    await waitFor(() =>
      expect(api.createBoard).toHaveBeenCalledWith({ name: 'Trip', columns: ['ត្រូវធ្វើ', 'កំពុងធ្វើ', 'រួចរាល់'] })
    );
    expect(push).toHaveBeenCalledWith('/boards/5');
  });

  it('lists boards with their card counts', async () => {
    vi.mocked(api.listBoards).mockResolvedValue([{ id: 1, name: 'Trip', card_count: 3 }]);
    renderWithIntl(<BoardsPage />);
    expect(await screen.findByRole('link', { name: 'Trip' })).toHaveAttribute('href', '/boards/1');
    expect(screen.getByText('3 cards')).toBeInTheDocument();
  });
});

describe('BoardPage', () => {
  it('shows columns and cards: label name, overdue date, Done column hint', async () => {
    renderWithIntl(<BoardPage boardId={1} />);
    const todo = (await screen.findByRole('region', { name: /To do/ })) as HTMLElement;
    expect(within(todo).getByText('Book flights')).toBeInTheDocument();
    expect(within(todo).getByText('Red')).toBeInTheDocument();
    expect(within(todo).getByText(/^Overdue/)).toBeInTheDocument();
    expect(within(todo).getByRole('button', { name: 'Move card Book flights' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Done/ })).toHaveTextContent('Cards here count as done');
  });

  it('adds a card with Enter: shown at once, then saved', async () => {
    let resolve: (card: Board['columns'][number]['cards'][number]) => void = () => {};
    vi.mocked(api.createCard).mockReturnValue(new Promise((r) => (resolve = r)));
    renderWithIntl(<BoardPage boardId={1} />);
    const done = (await screen.findByRole('region', { name: /Done/ })) as HTMLElement;

    fireEvent.click(within(done).getByRole('button', { name: 'Add card' }));
    const input = within(done).getByRole('textbox', { name: 'Title' });
    fireEvent.change(input, { target: { value: 'Pack bags' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await within(done).findByText('Pack bags')).toBeInTheDocument();
    expect(api.createCard).toHaveBeenCalledWith(30, {
      title: 'Pack bags',
      description: '',
      due_date: null,
      label: null,
    });
    await act(async () =>
      resolve({
        id: 9,
        column_id: 30,
        title: 'Pack bags',
        description: '',
        due_date: null,
        label: null,
        position: 1000,
      })
    );
    expect(within(done).getByText('Pack bags')).toBeInTheDocument();
  });

  it('edits a card: clearing the due date and label sends null', async () => {
    vi.mocked(api.updateCard).mockImplementation(async (id, input) => ({
      ...board().columns[0].cards[0],
      ...input,
      id,
    }));
    renderWithIntl(<BoardPage boardId={1} />);

    fireEvent.click(await screen.findByRole('button', { name: /^Book flights/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit card' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Clear date' }));
    fireEvent.click(within(dialog).getByRole('radio', { name: 'None' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(api.updateCard).toHaveBeenCalledWith(1, {
        title: 'Book flights',
        description: 'Before Friday',
        due_date: null,
        label: null,
      })
    );
  });
});

describe('useMoveCard', () => {
  it('moves the card in the cache at once and rolls back when the API refuses', async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(qk.boards.detail(1), board());
    let reject: (error: Error) => void = () => {};
    vi.mocked(api.moveCard).mockReturnValue(new Promise((_, r) => (reject = r)));
    const { result } = renderHook(() => useMoveCard(1), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    });

    act(() => result.current.mutate({ id: 1, columnId: 30, position: 1000 }));
    await waitFor(() =>
      expect(queryClient.getQueryData<Board>(qk.boards.detail(1))?.columns[1].cards.map((c) => c.id)).toEqual([1])
    );
    expect(api.moveCard).toHaveBeenCalledWith(1, 30, 1000);

    await act(async () => reject(new Error('down')));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData<Board>(qk.boards.detail(1))?.columns[0].cards.map((c) => c.id)).toEqual([1]);
  });
});
