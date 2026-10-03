import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/services/auth/auth-service';
import { ApiError } from '@/services/core/api-call';
import { renderWithIntl } from '@/test/render';

import { LoginForm } from './login-form';

const replace = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace }),
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('@/services/auth/auth-service', () => ({ login: vi.fn() }));

const user = {
  id: 1,
  username: 'demo',
  fullname: 'John doe',
  email: 'demo@example.com',
  avatar: null,
  created_at: '2026-01-01T00:00:00Z',
};

const fill = (username: string, password: string) => {
  fireEvent.change(screen.getByRole('textbox', { name: 'Username' }), { target: { value: username } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

describe('LoginForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('goes back to the page in `next` after logging in', async () => {
    vi.mocked(api.login).mockResolvedValue(user);
    renderWithIntl(<LoginForm next="/expenses?month=2026-09" />);
    fill('demo', 'password');
    submit();
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/expenses?month=2026-09'));
  });

  it('shows translated validation messages and does not call the API', async () => {
    renderWithIntl(<LoginForm />);
    submit();
    expect(await screen.findAllByText('Please fill in this field')).toHaveLength(2);
    expect(api.login).not.toHaveBeenCalled();
  });

  it('logs in and goes to the dashboard', async () => {
    vi.mocked(api.login).mockResolvedValue(user);
    renderWithIntl(<LoginForm />);
    fill(' demo ', 'password');
    submit();
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
    expect(vi.mocked(api.login).mock.calls[0]?.[0]).toEqual({ username: 'demo', password: 'password' });
  });

  it('shows an error for wrong credentials and clears the password', async () => {
    vi.mocked(api.login).mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS', 'nope'));
    renderWithIntl(<LoginForm />);
    fill('demo', 'wrong');
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong username or password. Please try again.');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(replace).not.toHaveBeenCalled();
  });

  it('toggles password visibility', () => {
    renderWithIntl(<LoginForm />);
    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('links to register and forgot password', () => {
    renderWithIntl(<LoginForm />);
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password');
  });

  it('is translated in Khmer', () => {
    renderWithIntl(<LoginForm />, { locale: 'km' });
    expect(screen.getByRole('button', { name: 'ចូលគណនី' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ចុះឈ្មោះ' })).toBeInTheDocument();
  });
});
