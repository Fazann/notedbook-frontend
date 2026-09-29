import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api-client';
import { renderWithIntl } from '@/test/render';

import * as api from '../api';
import type { User } from '../types';

import { ProfileForm } from './profile-form';

vi.mock('../api', () => ({ updateProfile: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const user: User = {
  id: 1,
  username: 'sokha',
  fullname: 'Sok Sokha',
  email: 'sokha@example.com',
  avatar: null,
  created_at: '2026-01-01T00:00:00Z',
};

const field = (name: string) => screen.getByRole('textbox', { name });
const change = (name: string, value: string) => fireEvent.change(field(name), { target: { value } });
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

describe('ProfileForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the current profile and disables save until something changes', () => {
    renderWithIntl(<ProfileForm user={user} />);
    expect(field('Full name')).toHaveValue('Sok Sokha');
    expect(field('Username')).toHaveValue('sokha');
    expect(field('Email')).toHaveValue('sokha@example.com');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('sends only the changed fields', async () => {
    vi.mocked(api.updateProfile).mockResolvedValue({ ...user, fullname: 'Sokha Chan' });
    renderWithIntl(<ProfileForm user={user} />);
    change('Full name', ' Sokha Chan ');
    save();
    await waitFor(() => expect(api.updateProfile).toHaveBeenCalled());
    expect(vi.mocked(api.updateProfile).mock.calls[0]?.[0]).toEqual({ fullname: 'Sokha Chan' });
  });

  it('validates with the API rules', async () => {
    renderWithIntl(<ProfileForm user={user} />);
    change('Full name', 'S');
    change('Username', 'sok.sokha');
    change('Email', 'not-an-email');
    save();
    expect(await screen.findByText('Full name must be at least 2 characters')).toBeInTheDocument();
    expect(screen.getByText('Use only letters and numbers, with single spaces between words')).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    expect(api.updateProfile).not.toHaveBeenCalled();
  });

  it('does not let an existing email be cleared', async () => {
    renderWithIntl(<ProfileForm user={user} />);
    change('Email', '');
    save();
    expect(await screen.findByText('Your email cannot be removed. Enter a new email instead.')).toBeInTheDocument();
    expect(api.updateProfile).not.toHaveBeenCalled();
  });

  it('shows a taken username under the username field', async () => {
    vi.mocked(api.updateProfile).mockRejectedValue(new ApiError(409, 'USERNAME_TAKEN', 'taken'));
    renderWithIntl(<ProfileForm user={user} />);
    change('Username', 'admin');
    save();
    expect(await screen.findByText('This username is already taken. Please choose another one.')).toBeInTheDocument();
    expect(field('Username')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows a form error when the network fails', async () => {
    vi.mocked(api.updateProfile).mockRejectedValue(new ApiError(0, 'network', 'Network error'));
    renderWithIntl(<ProfileForm user={user} />);
    change('Full name', 'Sokha Chan');
    save();
    expect(await screen.findByRole('alert')).toHaveTextContent('Network error. Please try again.');
  });

  it('is translated in Khmer', () => {
    renderWithIntl(<ProfileForm user={user} />, { locale: 'km' });
    expect(screen.getByRole('button', { name: 'រក្សាទុកការផ្លាស់ប្ដូរ' })).toBeInTheDocument();
  });
});
