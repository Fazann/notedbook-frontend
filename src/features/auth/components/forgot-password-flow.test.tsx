import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/services/auth/auth-service';
import { ApiError } from '@/services/core/api-call';
import { renderWithIntl } from '@/test/render';

import { ForgotPasswordFlow } from './forgot-password-flow';

vi.mock('@/services/auth/auth-service', () => ({
  requestResetCode: vi.fn(),
  verifyResetCode: vi.fn(),
  resetPassword: vi.fn(),
}));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const EMAIL = 'sok@example.com';

async function goToCodeStep() {
  renderWithIntl(<ForgotPasswordFlow />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: EMAIL } });
  fireEvent.click(screen.getByRole('button', { name: 'Send code' }));
  await screen.findByRole('heading', { name: 'Check your email' });
}

const typeCode = (value: string) => fireEvent.change(screen.getByLabelText('6-digit code'), { target: { value } });
const submitCode = () => fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

describe('ForgotPasswordFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.requestResetCode).mockResolvedValue({ expiresIn: 300 });
    vi.mocked(api.verifyResetCode).mockResolvedValue({ key: 'reset-key', expiresIn: 600 });
    vi.mocked(api.resetPassword).mockResolvedValue();
  });

  it('checks the email before sending a code', async () => {
    renderWithIntl(<ForgotPasswordFlow />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }));
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(api.requestResetCode).not.toHaveBeenCalled();
  });

  it('resets the password: email → code → new password → done', async () => {
    await goToCodeStep();
    expect(api.requestResetCode).toHaveBeenCalledWith(EMAIL);
    expect(screen.getByText(/sok@example\.com/)).toBeInTheDocument();
    // Resending waits for the cooldown.
    expect(screen.getByRole('button', { name: /Resend code in \d+s/ })).toBeDisabled();

    // Khmer digits are turned into Latin ones.
    typeCode('១២៣៤៥៦');
    expect(screen.getByLabelText('6-digit code')).toHaveValue('123456');
    submitCode();
    await screen.findByRole('heading', { name: 'Choose a new password' });
    expect(api.verifyResetCode).toHaveBeenCalledWith(EMAIL, '123456');

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'secret99' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'secret99' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

    await screen.findByRole('heading', { name: 'Password reset' });
    expect(api.resetPassword).toHaveBeenCalledWith('reset-key', 'secret99');
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('shows a wrong code under the code field', async () => {
    vi.mocked(api.verifyResetCode).mockRejectedValue(new ApiError(400, 'INVALID_OTP', 'The code is incorrect.'));
    await goToCodeStep();
    typeCode('000000');
    submitCode();
    expect(await screen.findByText(/This code is wrong or has expired/)).toBeInTheDocument();
  });

  it('asks for the full code before verifying', async () => {
    await goToCodeStep();
    typeCode('12a3');
    expect(screen.getByLabelText('6-digit code')).toHaveValue('123');
    submitCode();
    expect(await screen.findByText('Enter the 6-digit code from the email')).toBeInTheDocument();
    expect(api.verifyResetCode).not.toHaveBeenCalled();
  });

  it('offers to start again when the reset key expired', async () => {
    vi.mocked(api.resetPassword).mockRejectedValue(
      new ApiError(400, 'INVALID_RESET_KEY', 'This password reset request is invalid or has expired.')
    );
    await goToCodeStep();
    typeCode('123456');
    submitCode();
    await screen.findByRole('heading', { name: 'Choose a new password' });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'secret99' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'secret99' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Start again' }));
    await waitFor(() => expect(screen.getByLabelText('Email')).toHaveValue(EMAIL));
  });
});
