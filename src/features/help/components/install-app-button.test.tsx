import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render';

import { InstallAppButton } from './install-app-button';

function mockStandalone(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  );
}

function firePrompt() {
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return { event, prompt };
}

afterEach(() => vi.restoreAllMocks());

describe('InstallAppButton', () => {
  it('renders nothing until the browser offers to install', () => {
    mockStandalone(false);
    const { container } = renderWithIntl(<InstallAppButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a button that opens the browser install dialog once', async () => {
    mockStandalone(false);
    renderWithIntl(<InstallAppButton />);
    const { event, prompt } = firePrompt();
    expect(event.defaultPrevented).toBe(true);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Install app' }));
    });
    expect(prompt).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Install app' })).not.toBeInTheDocument();
  });

  it('says the app is installed when opened from the home screen', () => {
    mockStandalone(true);
    renderWithIntl(<InstallAppButton />, { locale: 'km' });
    expect(screen.getByRole('status')).toHaveTextContent('LifeApp ត្រូវបានដំឡើង');
  });
});
