import { forwardRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

import { getTurnstileSiteKey } from '@tasks-management/frontend-services';

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
}

/**
 * TurnstileWidget component wraps the Cloudflare Turnstile CAPTCHA widget.
 *
 * This component provides CAPTCHA protection for authentication flows (login, registration, forgot password).
 * It uses "managed" mode for minimal user friction - the widget automatically adapts between invisible
 * verification and interactive challenges based on risk assessment.
 *
 * @param onSuccess - Callback invoked when CAPTCHA verification succeeds, receives the token
 * @param onError - Optional callback invoked when CAPTCHA verification fails
 * @param onExpire - Optional callback invoked when the CAPTCHA token expires (after 5 minutes)
 *
 * @example
 * ```tsx
 * const turnstileRef = useRef<TurnstileInstance>(null);
 *
 * <TurnstileWidget
 *   ref={turnstileRef}
 *   onSuccess={(token) => setCaptchaToken(token)}
 *   onError={(error) => setError('CAPTCHA verification failed')}
 *   onExpire={() => setCaptchaToken('')}
 * />
 *
 * // Reset the widget after authentication failure
 * turnstileRef.current?.reset();
 * ```
 */
const TurnstileWidget = forwardRef<TurnstileInstance, TurnstileWidgetProps>(
  ({ onSuccess, onError, onExpire }, ref) => {
    const siteKey = getTurnstileSiteKey();

    // If site key is not configured, display an error message
    if (!siteKey) {
      return (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                CAPTCHA not configured
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Security verification is not available. Please contact support
                  or try again later.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Turnstile
        ref={ref}
        siteKey={siteKey}
        options={{
          theme: 'auto',
          size: 'normal',
          appearance: 'interaction-only', // Managed mode - minimal user interaction
        }}
        scriptOptions={{
          appendTo: 'head',
        }}
        onSuccess={onSuccess}
        onError={() => {
          if (onError) {
            onError('CAPTCHA verification failed. Please try again.');
          }
        }}
        onExpire={onExpire}
      />
    );
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';

export default TurnstileWidget;
