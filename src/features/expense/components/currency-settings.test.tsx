import { fireEvent, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/services/core/api-call';
import * as api from '@/services/currency/currency-service';
import { renderWithIntl } from '@/test/render';

import { CurrencySettings } from './currency-settings';

vi.mock('@/services/currency/currency-service', () => ({
  getCurrencySettings: vi.fn(),
  updateCurrencySettings: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const checkbox = (name: string) => screen.getByRole('checkbox', { name });

describe('CurrencySettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getCurrencySettings).mockResolvedValue({ enabled: ['USD', 'KHR'], defaultCurrency: 'KHR' });
  });

  it('shows the saved settings and keeps the last currency on', async () => {
    vi.mocked(api.getCurrencySettings).mockResolvedValue({ enabled: ['USD'], defaultCurrency: 'USD' });
    renderWithIntl(<CurrencySettings />);
    expect(await screen.findByRole('checkbox', { name: 'USD' })).toBeChecked();
    expect(checkbox('USD')).toBeDisabled();
    expect(checkbox('MYR')).not.toBeChecked();
    expect(screen.getByText('At least one currency must stay on.')).toBeInTheDocument();
  });

  it('saves a change to the API, moving the default off a turned-off currency', async () => {
    // The fake API keeps what was saved, like the real one (which also clears its cache).
    vi.mocked(api.updateCurrencySettings).mockImplementation(async (saved) => {
      vi.mocked(api.getCurrencySettings).mockResolvedValue(saved);
      return saved;
    });
    renderWithIntl(<CurrencySettings />);
    fireEvent.click(await screen.findByRole('checkbox', { name: 'KHR' }));
    await waitFor(() =>
      expect(api.updateCurrencySettings).toHaveBeenCalledWith({ enabled: ['USD'], defaultCurrency: 'USD' })
    );
    expect(checkbox('KHR')).not.toBeChecked();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Currencies saved'));
  });

  it('goes back to the saved settings when the API refuses', async () => {
    vi.mocked(api.updateCurrencySettings).mockRejectedValue(new ApiError(400, 'NO_CURRENCY_ENABLED', 'x'));
    renderWithIntl(<CurrencySettings />);
    fireEvent.click(await screen.findByRole('checkbox', { name: 'MYR' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Turn on at least one currency.'));
    await waitFor(() => expect(checkbox('MYR')).not.toBeChecked());
  });
});
