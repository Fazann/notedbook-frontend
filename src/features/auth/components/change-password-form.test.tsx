import { fireEvent, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/services/auth/auth-service';
import { ApiError } from '@/services/core/api-call';
import { renderWithIntl } from '@/test/render';

import { ChangePasswordForm } from './change-password-form';

vi.mock('@/services/auth/auth-service', () => ({ changePassword: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const user = {
  id: 1,
  username: 'John doe',
  fullname: 'Sok John doe',
  email: '',
  avatar: null,
  created_at: '2026-01-01T00:00:00Z',
};

const fill = (current: string, next: string, confirm = next) => {
  fireEvent.change(screen.getByLabelText('Current password'), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: next } });
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: confirm } });
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Change password' }));

describe('ChangePasswordForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires every field', async () => {
    renderWithIntl(<ChangePasswordForm />);
    submit();
    expect(await screen.findAllByText('Please fill in this field')).toHaveLength(3);
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it('checks length, confirmation and that the password changes', async () => {
    renderWithIntl(<ChangePasswordForm />);
    fill('secret1', 'abc', 'abd');
    submit();
    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();

    fill('secret1', 'secret1');
    submit();
    expect(await screen.findByText('Choose a password that is different from your current one')).toBeInTheDocument();
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it('changes the password and clears the form', async () => {
    vi.mocked(api.changePassword).mockResolvedValue(user);
    renderWithIntl(<ChangePasswordForm />);
    fill('secret1', 'secret22');
    submit();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Password changed'));
    expect(vi.mocked(api.changePassword).mock.calls[0]?.[0]).toEqual({
      currentPassword: 'secret1',
      newPassword: 'secret22',
      confirmPassword: 'secret22',
    });
    expect(screen.getByLabelText('Current password')).toHaveValue('');
  });

  it('shows a wrong current password under that field', async () => {
    vi.mocked(api.changePassword).mockRejectedValue(new ApiError(400, 'INCORRECT_PASSWORD', 'wrong'));
    renderWithIntl(<ChangePasswordForm />);
    fill('wrong1', 'secret22');
    submit();
    expect(await screen.findByText('Your current password is incorrect.')).toBeInTheDocument();
    expect(screen.getByLabelText('Current password')).toHaveAttribute('aria-invalid', 'true');
  });

  it('maps API field errors to the form fields', async () => {
    vi.mocked(api.changePassword).mockRejectedValue(
      new ApiError(400, 'VALIDATION_FAILED', 'invalid', { new_password: 'new_password is too long.' })
    );
    renderWithIntl(<ChangePasswordForm />);
    fill('secret1', 'secret22');
    submit();
    expect(await screen.findByText('new_password is too long.')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toHaveAttribute('aria-invalid', 'true');
  });
});
