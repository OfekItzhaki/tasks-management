import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../test/utils';
import LoginPage from './LoginPage';

describe('LoginPage (integration)', () => {
  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    // Wait for the CAPTCHA widget to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('turnstile-widget')).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText(/name@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const form = screen.getByLabelText(/sign in/i).closest('form');
    await user.type(emailInput, 'invalid');
    await user.type(passwordInput, 'x');
    if (form) fireEvent.submit(form);

    expect(emailInput).toBeInvalid();
  });

  it('submits login successfully (no error shown)', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    // Wait for the CAPTCHA widget to be rendered and token to be set
    await waitFor(() => {
      expect(screen.getByTestId('turnstile-widget')).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText(/name@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submit = screen.getByLabelText(/sign in/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submit);
    await waitFor(() => {
      expect(
        screen.queryByText(/invalid credentials|login failed/i)
      ).not.toBeInTheDocument();
    });
  });

  it('shows error when login fails', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    // Wait for the CAPTCHA widget to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('turnstile-widget')).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText(/name@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submit = screen.getByLabelText(/sign in/i);

    await user.type(emailInput, 'fail@example.com');
    await user.type(passwordInput, 'password123');

    // Wait a moment for the mock widget to set the token
    await new Promise((resolve) => setTimeout(resolve, 100));

    await user.click(submit);

    await waitFor(
      () => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
