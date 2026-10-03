import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/services/auth/auth-service';
import { ApiError } from '@/services/core/api-call';
import { renderWithIntl } from '@/test/render';

import { RegisterForm } from './register-form';

const replace = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace }),
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('@/services/auth/auth-service', () => ({ register: vi.fn() }));

const user = {
  id: 2,
  username: 'John doe',
  fullname: 'Sok John doe',
  email: '',
  avatar: null,
  created_at: '2026-01-01T00:00:00Z',
};

const fill = (values: { fullname?: string; username?: string; email?: string; password?: string }) => {
  if (values.fullname !== undefined)
    fireEvent.change(screen.getByRole('textbox', { name: 'Full name' }), { target: { value: values.fullname } });
  if (values.username !== undefined)
    fireEvent.change(screen.getByRole('textbox', { name: 'Username' }), { target: { value: values.username } });
  if (values.email !== undefined)
    fireEvent.change(screen.getByRole('textbox', { name: 'Email (optional)' }), { target: { value: values.email } });
  if (values.password !== undefined)
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: values.password } });
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

describe('RegisterForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires full name, username and password but not email', async () => {
    renderWithIntl(<RegisterForm />);
    submit();
    expect(await screen.findAllByText('Please fill in this field')).toHaveLength(3);
    expect(api.register).not.toHaveBeenCalled();
  });

  it('validates username format, email and password length', async () => {
    renderWithIntl(<RegisterForm />);
    fill({ fullname: 'Sok John doe', username: 'sok John doe', email: 'not-an-email', password: 'abc' });
    submit();
    expect(await screen.findByText('Use only letters, numbers, dots (.) and underscores (_)')).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    expect(api.register).not.toHaveBeenCalled();
  });

  it('rejects a password longer than the API allows (20)', async () => {
    renderWithIntl(<RegisterForm />);
    fill({ fullname: 'Sok John doe', username: 'John doe', password: 'a'.repeat(21) });
    submit();
    expect(await screen.findByText('Password is too long')).toBeInTheDocument();
    expect(api.register).not.toHaveBeenCalled();
  });

  it('registers without an email and goes to the dashboard', async () => {
    vi.mocked(api.register).mockResolvedValue(user);
    renderWithIntl(<RegisterForm />);
    fill({ fullname: ' Sok John doe ', username: ' John doe ', password: 'password123' });
    submit();
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
    expect(vi.mocked(api.register).mock.calls[0]?.[0]).toEqual({
      fullname: 'Sok John doe',
      username: 'John doe',
      email: '',
      password: 'password123',
    });
  });

  it('shows a taken username under the username field', async () => {
    vi.mocked(api.register).mockRejectedValue(new ApiError(409, 'USERNAME_TAKEN', 'taken'));
    renderWithIntl(<RegisterForm />);
    fill({ fullname: 'Sok John doe', username: 'demo', password: 'password123' });
    submit();
    expect(await screen.findByText('This username is already taken. Please choose another one.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Username' })).toHaveAttribute('aria-invalid', 'true');
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows a form error when the network fails', async () => {
    vi.mocked(api.register).mockRejectedValue(new ApiError(0, 'network', 'Network error'));
    renderWithIntl(<RegisterForm />);
    fill({ fullname: 'Sok John doe', username: 'John doe', password: 'password123' });
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Network error. Please try again.');
  });

  it('links back to log in', () => {
    renderWithIntl(<RegisterForm />);
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('is translated in Khmer', () => {
    renderWithIntl(<RegisterForm />, { locale: 'km' });
    expect(screen.getByRole('button', { name: 'បង្កើតគណនី' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ចូលគណនី' })).toBeInTheDocument();
  });
});
