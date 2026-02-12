# Design Document: Cloudflare Turnstile CAPTCHA Integration

## Overview

This design document outlines the implementation of Cloudflare Turnstile CAPTCHA protection for the Horizon Flux application's authentication flows. The implementation will integrate Turnstile widgets into the web frontend's login and registration forms, and add server-side token verification to the NestJS backend.

Cloudflare Turnstile is a privacy-focused CAPTCHA alternative that provides bot protection with minimal user friction. The implementation will use "managed" mode, which automatically adapts between invisible verification and interactive challenges based on risk assessment.

The design follows a defense-in-depth approach where:

1. Frontend renders the Turnstile widget and collects tokens
2. Frontend includes tokens in authentication requests
3. Backend verifies tokens with Cloudflare before processing authentication
4. Failed verification results in request rejection

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Web Frontend                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              LoginPage Component                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │         Turnstile Widget                           │  │   │
│  │  │  - Renders challenge                               │  │   │
│  │  │  - Generates token on success                      │  │   │
│  │  │  - Stores token in state                           │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                            │   │
│  │  Form Submission → includes captchaToken                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    HTTP POST with token
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend Services                           │
│  - AuthService.login(email, password, captchaToken?)            │
│  - AuthService.registerStart(email, captchaToken?)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    API Request with token
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Backend API                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           AuthController                                  │   │
│  │  - Receives request with captchaToken                     │   │
│  │  - Calls AuthService.verifyTurnstile()                    │   │
│  │  - Proceeds with authentication if verified               │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           AuthService                                     │   │
│  │  - verifyTurnstile(token)                                 │   │
│  │  - Makes POST to Cloudflare API                           │   │
│  │  - Validates response                                     │   │
│  │  - Throws ForbiddenException on failure                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    HTTPS POST Request
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare Turnstile API                            │
│  https://challenges.cloudflare.com/turnstile/v0/siteverify     │
│  - Validates token                                               │
│  - Returns success/failure + metadata                            │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Login Flow:**

1. User navigates to LoginPage
2. Turnstile widget initializes and runs background challenge
3. Widget generates token and stores in component state
4. User enters credentials and submits form
5. Frontend calls authService.login(email, password, captchaToken)
6. Backend receives request, verifies token with Cloudflare
7. If verification succeeds, backend validates credentials
8. If verification fails, backend returns 403 error
9. Frontend displays appropriate error message

**Registration Flow:**

1. User navigates to LoginPage and switches to registration mode
2. Turnstile widget initializes and runs background challenge
3. Widget generates token and stores in component state
4. User enters email and clicks verify
5. Frontend calls authService.registerStart(email, captchaToken)
6. Backend receives request, verifies token with Cloudflare
7. If verification succeeds, backend sends OTP email
8. If verification fails, backend returns 403 error
9. Frontend displays appropriate error message

**Forgot Password Flow:**

1. User navigates to LoginPage and clicks "Forgot Password"
2. Turnstile widget initializes and runs background challenge
3. Widget generates token and stores in component state
4. User enters email and submits
5. Frontend calls authService.forgotPassword(email, captchaToken)
6. Backend receives request, verifies token with Cloudflare
7. If verification succeeds, backend sends password reset OTP
8. If verification fails, backend returns 403 error
9. Frontend displays appropriate error message

## Components and Interfaces

### Frontend Components

#### TurnstileWidget Component

A new React component that wraps the @marsidev/react-turnstile library:

```typescript
interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
}

function TurnstileWidget({ onSuccess, onError, onExpire }: TurnstileWidgetProps) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const turnstileRef = useRef<TurnstileInstance>(null);

  return (
    <Turnstile
      ref={turnstileRef}
      siteKey={siteKey}
      options={{
        theme: 'auto',
        size: 'normal',
        appearance: 'interaction-only'
      }}
      onSuccess={onSuccess}
      onError={onError}
      onExpire={onExpire}
    />
  );
}
```

#### LoginPage Integration

The existing LoginPage component will be modified to:

- Import and render TurnstileWidget
- Store captcha token in state
- Pass token to authentication methods
- Reset widget on authentication failure

```typescript
function LoginPage() {
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleCaptchaSuccess = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaError = (error: string) => {
    setError('CAPTCHA verification failed. Please try again.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setError('Please complete the security verification.');
      return;
    }

    try {
      await login({ email, password, captchaToken });
      navigate('/lists');
    } catch (err) {
      // Reset turnstile on error
      turnstileRef.current?.reset();
      setCaptchaToken('');
      setError(getErrorMessage(err, 'Login failed'));
    }
  };

  return (
    // ... existing JSX
    <TurnstileWidget
      ref={turnstileRef}
      onSuccess={handleCaptchaSuccess}
      onError={handleCaptchaError}
    />
    // ... rest of form
  );
}
```

### Frontend Services Layer

#### AuthService Updates

The shared AuthService in frontend-services will be updated to accept optional captchaToken parameters:

```typescript
class AuthService {
  async login(credentials: LoginDto & { captchaToken?: string }): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    TokenStorage.setToken(response.accessToken);
    return response;
  }

  async registerStart(email: string, captchaToken?: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/register/start', {
      email,
      captchaToken,
    });
  }

  async forgotPassword(email: string, captchaToken?: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/forgot-password', {
      email,
      captchaToken,
    });
  }
}
```

#### Type Definitions

```typescript
// In frontend-services/src/types/index.ts
export interface LoginDto {
  email: string;
  password: string;
  captchaToken?: string;
}

export interface RegisterStartDto {
  email: string;
  captchaToken?: string;
}

export interface ForgotPasswordDto {
  email: string;
  captchaToken?: string;
}
```

### Backend Components

#### AuthService.verifyTurnstile()

The backend already has a `verifyTurnstile()` method implemented. The design confirms this implementation is correct:

```typescript
async verifyTurnstile(token: string): Promise<void> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Skip verification if secret key not configured (dev mode)
  if (!secretKey) {
    this.logger.warn('TURNSTILE_SECRET_KEY not set. Skipping verification.');
    return;
  }

  try {
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        secret: secretKey,
        response: token,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const data = response.data;

    if (!data.success) {
      this.logger.warn(`Turnstile verification failed: ${JSON.stringify(data)}`);
      throw new ForbiddenException('CAPTCHA verification failed');
    }

    // Verification successful
    this.logger.debug('Turnstile verification successful');
  } catch (error) {
    if (error instanceof ForbiddenException) throw error;
    this.logger.error('Error verifying Turnstile token', error);
    throw new ForbiddenException('CAPTCHA verification failed');
  }
}
```

#### AuthController Updates

The controller already has the verification logic in place:

```typescript
@Post('login')
async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
  // Verify CAPTCHA if token provided or if secret key is configured
  if (loginDto.captchaToken) {
    await this.authService.verifyTurnstile(loginDto.captchaToken);
  } else if (process.env.TURNSTILE_SECRET_KEY) {
    throw new BadRequestException('CAPTCHA token required');
  }

  const result = await this.authService.login(loginDto.email, loginDto.password);
  this.setRefreshTokenCookie(response, result.refreshToken);

  const { refreshToken, ...rest } = result;
  return rest;
}

@Post('register/start')
async registerStart(@Body() dto: RegisterStartDto) {
  // Verify CAPTCHA if token provided or if secret key is configured
  if (dto.captchaToken) {
    await this.authService.verifyTurnstile(dto.captchaToken);
  } else if (process.env.TURNSTILE_SECRET_KEY) {
    throw new BadRequestException('CAPTCHA token required');
  }

  return this.authService.registerStart(dto.email);
}

@Post('forgot-password')
async forgotPassword(@Body() dto: ForgotPasswordDto) {
  // Verify CAPTCHA if token provided or if secret key is configured
  if (dto.captchaToken) {
    await this.authService.verifyTurnstile(dto.captchaToken);
  } else if (process.env.TURNSTILE_SECRET_KEY) {
    throw new BadRequestException('CAPTCHA token required');
  }

  return this.authService.forgotPassword(dto.email);
}
```

## Data Models

### Turnstile Verification Request

```typescript
interface TurnstileVerificationRequest {
  secret: string; // Secret key from environment
  response: string; // Token from frontend
  remoteip?: string; // Optional: client IP address
}
```

### Turnstile Verification Response

```typescript
interface TurnstileVerificationResponse {
  success: boolean; // Whether verification succeeded
  challenge_ts?: string; // ISO timestamp of challenge
  hostname?: string; // Hostname where challenge was served
  'error-codes'?: string[]; // Array of error codes if failed
  action?: string; // Custom action identifier
  cdata?: string; // Custom data payload
}
```

### Error Codes

Cloudflare Turnstile returns specific error codes:

- `missing-input-secret`: Secret parameter not provided
- `invalid-input-secret`: Secret key is invalid or expired
- `missing-input-response`: Response parameter was not provided
- `invalid-input-response`: Token is invalid, malformed, or expired
- `bad-request`: Request is malformed
- `timeout-or-duplicate`: Token has already been validated or expired
- `internal-error`: Internal error occurred

### Environment Variables

**Backend (.env):**

```bash
TURNSTILE_SECRET_KEY=<secret-key-from-cloudflare>
```

**Frontend (.env):**

```bash
VITE_TURNSTILE_SITE_KEY=<site-key-from-cloudflare>
```

**Test Keys (for development):**

- Site Key: `1x00000000000000000000AA` (always passes)
- Secret Key: `1x0000000000000000000000000000000AA` (always passes)

## Error Handling

### Frontend Error Handling

**Widget Load Failure:**

- Display error message: "Unable to load security verification. Please refresh the page."
- Disable form submission
- Log error to console

**Token Generation Failure:**

- Display error message: "CAPTCHA verification failed. Please try again."
- Reset widget for retry
- Allow user to retry

**Token Expiration:**

- Automatically reset widget when token expires (5 minutes)
- Generate new token before form submission
- Display message if user attempts to submit with expired token

**Backend Verification Failure:**

- Display error message from backend: "CAPTCHA verification failed"
- Reset widget for new attempt
- Clear stored token

### Backend Error Handling

**Missing Secret Key:**

- Log warning: "TURNSTILE_SECRET_KEY not set. Skipping verification."
- Allow request to proceed (development mode)
- Do not throw error

**Missing Token (when secret key is set):**

- Return 400 Bad Request
- Error message: "CAPTCHA token required"

**Invalid Token:**

- Return 403 Forbidden
- Error message: "CAPTCHA verification failed"
- Log warning with error details

**Cloudflare API Error:**

- Return 403 Forbidden
- Error message: "CAPTCHA verification failed"
- Log error with full details for debugging

**Network Timeout:**

- Implement 5-second timeout for verification requests
- Return 403 Forbidden on timeout
- Log timeout error

### Error Response Format

```typescript
// Backend error response
{
  statusCode: 403,
  message: 'CAPTCHA verification failed',
  error: 'Forbidden'
}

// Frontend displays user-friendly message
"Security verification failed. Please try again."
```

## Testing Strategy

### Unit Testing

**Frontend Unit Tests:**

1. TurnstileWidget component renders correctly
2. TurnstileWidget calls onSuccess with token
3. TurnstileWidget calls onError on failure
4. LoginPage stores captcha token in state
5. LoginPage includes token in login request
6. LoginPage resets widget on authentication failure
7. LoginPage prevents submission without token (when required)

**Backend Unit Tests:**

1. AuthService.verifyTurnstile() calls Cloudflare API correctly
2. AuthService.verifyTurnstile() throws ForbiddenException on failure
3. AuthService.verifyTurnstile() skips verification when secret key not set
4. AuthController requires token when secret key is set
5. AuthController allows request without token when secret key not set
6. AuthController returns 403 on verification failure

### Property-Based Testing

Property-based tests will be defined after prework analysis of acceptance criteria.

### Integration Testing

**End-to-End Tests:**

1. Complete login flow with valid CAPTCHA token
2. Complete registration flow with valid CAPTCHA token
3. Login rejection with invalid CAPTCHA token
4. Registration rejection with invalid CAPTCHA token
5. Login success without CAPTCHA when secret key not configured
6. Widget reset and retry after failure

**Manual Testing Checklist:**

1. Test with Cloudflare test keys (always pass)
2. Test with production keys in staging environment
3. Verify invisible mode works for legitimate users
4. Verify interactive challenge appears for suspicious activity
5. Test token expiration after 5 minutes
6. Test error handling for network failures
7. Test graceful degradation when Turnstile service is unavailable

### Test Configuration

**Development Environment:**

- Use Cloudflare test keys that always pass
- Set `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA`
- Set `VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA`

**Staging Environment:**

- Use production keys with staging domain registered
- Test with real Cloudflare verification

**Production Environment:**

- Use production keys with production domain registered
- Monitor verification success/failure rates
- Set up alerts for high failure rates

## Mobile Application Strategy

### Current Limitations

The @marsidev/react-turnstile library is designed for web browsers and has limited React Native support. Cloudflare Turnstile relies on browser APIs that are not available in React Native.

### Recommended Approach

**Option 1: WebView Integration (Recommended)**

- Render Turnstile widget in a WebView component
- Use WebView message passing to communicate token to React Native
- Requires additional complexity but provides full Turnstile functionality

**Option 2: Deferred Implementation**

- Allow mobile app to authenticate without CAPTCHA initially
- Backend already supports optional CAPTCHA (when secret key not set)
- Implement mobile CAPTCHA in future iteration

**Option 3: Alternative CAPTCHA for Mobile**

- Use a different CAPTCHA provider with better React Native support
- Maintain Turnstile for web, use alternative for mobile
- Backend would need to support multiple verification methods

### Implementation Plan

For the initial implementation:

1. Focus on web frontend integration
2. Document mobile limitations in README
3. Configure backend to allow mobile requests without CAPTCHA
4. Plan mobile implementation for future sprint

The backend's flexible design (optional CAPTCHA when secret key not set) allows mobile development to proceed independently while web uses CAPTCHA protection.

## Configuration and Deployment

### Obtaining Cloudflare Keys

1. Log in to Cloudflare Dashboard
2. Navigate to Turnstile section
3. Click "Add Site"
4. Configure widget:
   - **Widget Mode**: Managed (recommended)
   - **Domain**: Add your domain(s)
   - **Widget Name**: "Horizon Flux - Login/Registration"
5. Copy Site Key and Secret Key
6. Add keys to environment variables

### Environment Configuration

**Backend (.env):**

```bash
# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=<your-secret-key>
```

**Frontend (.env):**

```bash
# Cloudflare Turnstile
VITE_TURNSTILE_SITE_KEY=<your-site-key>
```

**Backend (.env.example):**

```bash
# Cloudflare Turnstile (CAPTCHA)
# Get these keys from the Cloudflare Dashboard: https://dash.cloudflare.com/?to=/:account/turnstile
# Leave unset to disable CAPTCHA verification (development mode)
TURNSTILE_SECRET_KEY=
```

### Deployment Checklist

1. Install @marsidev/react-turnstile in web-app
2. Create TurnstileWidget component
3. Integrate widget into LoginPage
4. Update frontend-services types and methods
5. Verify backend implementation (already exists)
6. Update .env.example files with documentation
7. Test with Cloudflare test keys
8. Obtain production keys from Cloudflare
9. Configure production environment variables
10. Deploy and monitor verification success rates

### Security Considerations

1. **Never expose secret key**: Secret key must only be in backend environment
2. **Use HTTPS**: All communication with Cloudflare API must use HTTPS
3. **Single-use tokens**: Each token can only be verified once
4. **Server-side verification**: Never trust client-side validation
5. **Token expiration**: Tokens expire after 5 minutes
6. **Rate limiting**: Consider adding rate limiting to auth endpoints
7. **Logging**: Log verification failures for security monitoring
8. **Graceful degradation**: Handle Cloudflare service outages appropriately

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Authentication Requests Include CAPTCHA Token

_For any_ authentication request (login, registration, or forgot password) where a CAPTCHA token has been generated, the request payload SHALL include the captchaToken field.

**Validates: Requirements 1.2, 1.3, 1.4, 4.4**

### Property 2: Token Storage After Generation

_For any_ successful Turnstile widget token generation, the Web_Frontend SHALL store the token in component state for subsequent form submission.

**Validates: Requirements 1.5**

### Property 3: Verification Before Authentication

_For any_ authentication request containing a CAPTCHA token (login, registration, or forgot password), the Backend_API SHALL call the Cloudflare verification API before executing authentication logic (credential validation, user creation, or OTP sending).

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Failed Verification Returns 403

_For any_ CAPTCHA token that fails Cloudflare verification, the Backend_API SHALL return a 403 Forbidden error with the message "CAPTCHA verification failed".

**Validates: Requirements 2.4, 2.5**

### Property 5: Form Submission Requires Token

_For any_ form submission attempt when CAPTCHA is enabled, the Web_Frontend SHALL prevent submission if no CAPTCHA token exists and display a validation message.

**Validates: Requirements 5.4, 6.4**

### Property 6: Widget Reset After Authentication Failure

_For any_ authentication failure (after successful CAPTCHA verification), the Web_Frontend SHALL reset the Turnstile widget to generate a new token for the next attempt.

**Validates: Requirements 5.5**

### Property 7: Token Verification Endpoint Agnostic

_For any_ valid CAPTCHA token (regardless of client type - web or mobile), the Backend_API SHALL verify it using the same verification endpoint and logic.

**Validates: Requirements 7.3**

### Property 8: Secret Key Never Exposed

_For any_ API response from the Backend_API, the response payload SHALL NOT contain the TURNSTILE_SECRET_KEY value.

**Validates: Requirements 9.1**

### Property 9: Single-Use Token Validation

_For any_ CAPTCHA token, attempting to verify it more than once SHALL result in verification failure on subsequent attempts.

**Validates: Requirements 9.2**

### Property 10: Server-Side Verification Required

_For any_ authentication request when TURNSTILE_SECRET_KEY is configured, the Backend_API SHALL perform server-side token verification and SHALL NOT trust any client-side validation claims.

**Validates: Requirements 9.3**

### Property 11: Failed Verification Logging

_For any_ failed CAPTCHA verification attempt, the Backend_API SHALL create a log entry containing the failure details for security monitoring.

**Validates: Requirements 9.5**

### Property 12: Network Error Handling

_For any_ network error or timeout when calling Cloudflare's verification API, the Backend_API SHALL log the error and return a 403 Forbidden error to the client.

**Validates: Requirements 10.1**

### Property 13: Retry After Network Failure

_For any_ CAPTCHA verification failure due to network issues, the Web_Frontend SHALL allow the user to retry by resetting the widget and generating a new token.

**Validates: Requirements 10.3**

### Example-Based Test Cases

The following acceptance criteria are best validated through specific example tests rather than property-based tests:

**Example 1: Widget Initialization**

- Verify LoginPage renders TurnstileWidget with correct siteKey from environment
- **Validates: Requirements 1.1**

**Example 2: Widget Load Failure Error Message**

- Simulate widget load failure and verify error message: "Unable to load security verification. Please refresh the page."
- **Validates: Requirements 1.5**

**Example 3: Missing Secret Key Behavior**

- Configure backend without TURNSTILE_SECRET_KEY and verify requests proceed without verification
- Verify warning is logged
- **Validates: Requirements 2.5, 3.3**

**Example 4: Environment Variable Configuration**

- Verify backend reads secret key from TURNSTILE_SECRET_KEY environment variable
- Verify frontend reads site key from VITE_TURNSTILE_SITE_KEY environment variable
- **Validates: Requirements 3.1, 3.2**

**Example 5: Missing Site Key Error**

- Configure frontend without VITE_TURNSTILE_SITE_KEY and verify error message is displayed
- **Validates: Requirements 3.4**

**Example 6: Environment Documentation**

- Verify .env.example files contain TURNSTILE_SECRET_KEY and VITE_TURNSTILE_SITE_KEY with instructions
- **Validates: Requirements 3.5**

**Example 7: Frontend Services Method Signatures**

- Verify AuthService.login() accepts optional captchaToken parameter
- Verify AuthService.registerStart() accepts optional captchaToken parameter
- Verify AuthService.forgotPassword() accepts optional captchaToken parameter
- **Validates: Requirements 4.1, 4.2, 4.3**

**Example 8: DTO Type Definitions**

- Verify LoginDto includes optional captchaToken field
- Verify RegisterStartDto includes optional captchaToken field
- Verify ForgotPasswordDto includes optional captchaToken field
- **Validates: Requirements 4.5, 4.6, 4.7**

**Example 9: Verification Failure Error Message**

- Simulate verification failure and verify error message: "CAPTCHA verification failed. Please try again."
- **Validates: Requirements 5.1**

**Example 10: Widget Load Timeout**

- Simulate widget load timeout and verify error message is displayed
- **Validates: Requirements 5.2**

**Example 11: Missing Token Error**

- Send authentication request without token when TURNSTILE_SECRET_KEY is set
- Verify 400 Bad Request with message "CAPTCHA token required"
- **Validates: Requirements 5.3**

**Example 12: Widget Mode Configuration**

- Verify TurnstileWidget is configured with "managed" mode
- **Validates: Requirements 6.1**

**Example 13: Mobile Documentation**

- Verify design document notes React Native limitations
- Verify design document recommends WebView approach
- Verify mobile implementation strategy is documented
- **Validates: Requirements 7.1, 7.2, 7.5**

**Example 14: Test Key Support**

- Verify widget works with Cloudflare test site key (1x00000000000000000000AA)
- Verify backend successfully verifies tokens from test key
- Verify documentation includes test key instructions
- **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

**Example 15: HTTPS Protocol**

- Verify Cloudflare API URL uses HTTPS protocol
- **Validates: Requirements 9.4**

**Example 16: Widget Timeout Configuration**

- Verify widget displays timeout error after 10 seconds of load failure
- **Validates: Requirements 10.2**

**Example 17: Verification Request Timeout**

- Verify backend implements 5-second timeout for Cloudflare API requests
- **Validates: Requirements 10.4**

### Testing Implementation Notes

**Property-Based Tests:**

- Each property test should run minimum 100 iterations
- Use random test data generation for tokens, requests, and responses
- Mock Cloudflare API responses for property tests
- Tag each test with: `Feature: cloudflare-turnstile-captcha, Property N: [property title]`

**Example Tests:**

- Use specific test cases with known inputs and expected outputs
- Mock external dependencies (Cloudflare API, environment variables)
- Test both success and failure paths
- Verify exact error messages and status codes

**Integration Tests:**

- Test complete authentication flows with CAPTCHA
- Use Cloudflare test keys for predictable behavior
- Test widget lifecycle (render → generate token → submit → reset)
- Verify end-to-end error handling

**Manual Testing:**

- Test with production keys in staging environment
- Verify invisible mode behavior with legitimate traffic
- Test interactive challenge appears for suspicious activity
- Verify token expiration after 5 minutes
- Test graceful degradation scenarios
