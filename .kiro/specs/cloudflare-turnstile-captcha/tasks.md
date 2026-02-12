# Implementation Plan: Cloudflare Turnstile CAPTCHA Integration

## Overview

This implementation plan breaks down the Cloudflare Turnstile CAPTCHA integration into discrete coding tasks. The implementation will add CAPTCHA protection to login, registration, and forgot password flows in both the web frontend and backend API.

The backend already has the core verification logic implemented (`AuthService.verifyTurnstile()` and controller checks), so the focus will be on:

1. Frontend widget integration
2. Frontend services layer updates
3. Backend DTO updates for forgot password
4. Testing and validation

## Tasks

- [x] 1. Install and configure Turnstile package in web-app
  - Install @marsidev/react-turnstile package
  - Verify VITE_TURNSTILE_SITE_KEY is in .env file
  - Update .env.example with Turnstile configuration documentation
  - _Requirements: 3.2, 3.5_

- [x] 2. Create TurnstileWidget component
  - [x] 2.1 Implement TurnstileWidget component
    - Create new component at web-app/src/components/TurnstileWidget.tsx
    - Accept onSuccess, onError, and onExpire callback props
    - Read site key from environment variable
    - Configure widget with managed mode and auto theme
    - Expose ref for reset functionality
    - _Requirements: 1.1, 6.1_

  - [ ]\* 2.2 Write unit tests for TurnstileWidget
    - Test component renders with correct site key
    - Test onSuccess callback is called with token
    - Test onError callback is called on failure
    - Test onExpire callback is called on expiration
    - Test ref methods (reset) work correctly
    - _Requirements: 1.1, 6.1_

- [x] 3. Integrate Turnstile into LoginPage
  - [x] 3.1 Add Turnstile widget to LoginPage
    - Import TurnstileWidget component
    - Add captchaToken state variable
    - Add turnstileRef for widget control
    - Render TurnstileWidget in the form
    - Implement handleCaptchaSuccess to store token
    - Implement handleCaptchaError to display error
    - Implement handleCaptchaExpire to clear token
    - _Requirements: 1.1, 1.5_

  - [x] 3.2 Update login form submission
    - Pass captchaToken to login method
    - Reset widget on authentication failure
    - Clear token after failed attempt
    - Prevent submission if token missing (when required)
    - _Requirements: 1.2, 5.4, 5.5_

  - [x] 3.3 Update registration form submission
    - Pass captchaToken to registerStart method
    - Reset widget on registration failure
    - Clear token after failed attempt
    - _Requirements: 1.3, 5.5_

  - [x] 3.4 Update forgot password form submission
    - Pass captchaToken to forgotPassword method
    - Reset widget on forgot password failure
    - Clear token after failed attempt
    - _Requirements: 1.4, 5.5_

  - [ ]\* 3.5 Write unit tests for LoginPage integration
    - Test captcha token is stored in state on success
    - Test login includes captcha token in request
    - Test registration includes captcha token in request
    - Test forgot password includes captcha token in request
    - Test widget is reset after authentication failure
    - Test form submission is prevented without token
    - _Requirements: 1.2, 1.3, 1.4, 5.4, 5.5_

- [x] 4. Checkpoint - Test frontend widget integration
  - Ensure TurnstileWidget renders correctly
  - Verify token generation works with test site key
  - Verify error handling displays appropriate messages
  - Ask the user if questions arise

- [x] 5. Update frontend-services types
  - [x] 5.1 Add captchaToken to LoginDto type
    - Update LoginDto interface to include optional captchaToken field
    - _Requirements: 4.5_

  - [x] 5.2 Add captchaToken to RegisterStartDto type
    - Update RegisterStartDto interface to include optional captchaToken field
    - _Requirements: 4.6_

  - [x] 5.3 Create ForgotPasswordDto type
    - Create new ForgotPasswordDto interface with email and optional captchaToken
    - Export from types/index.ts
    - _Requirements: 4.7_

  - [ ]\* 5.4 Write unit tests for type definitions
    - Verify LoginDto includes captchaToken field
    - Verify RegisterStartDto includes captchaToken field
    - Verify ForgotPasswordDto includes captchaToken field
    - _Requirements: 4.5, 4.6, 4.7_

- [x] 6. Update frontend-services AuthService
  - [x] 6.1 Update login method signature
    - Modify login method to accept captchaToken in credentials
    - Include captchaToken in API request payload
    - _Requirements: 4.1, 4.4_

  - [x] 6.2 Update registerStart method signature
    - Modify registerStart to accept optional captchaToken parameter
    - Include captchaToken in API request payload
    - _Requirements: 4.2, 4.4_

  - [x] 6.3 Update forgotPassword method signature
    - Modify forgotPassword to accept optional captchaToken parameter
    - Include captchaToken in API request payload
    - _Requirements: 4.3, 4.4_

  - [ ]\* 6.4 Write property test for AuthService token inclusion
    - **Property 1: Authentication Requests Include CAPTCHA Token**
    - **Validates: Requirements 1.2, 1.3, 1.4, 4.4**

  - [ ]\* 6.5 Write unit tests for AuthService methods
    - Test login includes captchaToken when provided
    - Test registerStart includes captchaToken when provided
    - Test forgotPassword includes captchaToken when provided
    - Test methods work without captchaToken (optional)
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Update backend DTOs
  - [x] 7.1 Add captchaToken to ForgotPasswordDto
    - Add optional captchaToken field to ForgotPasswordDto class
    - Add @IsString() and @IsOptional() decorators
    - Add ApiProperty documentation
    - _Requirements: 4.7_

  - [ ]\* 7.2 Write unit tests for DTO validation
    - Test ForgotPasswordDto accepts optional captchaToken
    - Test validation passes with and without captchaToken
    - _Requirements: 4.7_

- [x] 8. Update backend AuthController
  - [x] 8.1 Add CAPTCHA verification to forgotPassword endpoint
    - Add verification logic to forgotPassword method
    - Check if captchaToken is provided
    - Call authService.verifyTurnstile() if token present
    - Throw BadRequestException if token required but missing
    - _Requirements: 2.3_

  - [ ]\* 8.2 Write unit tests for controller verification logic
    - Test forgotPassword calls verifyTurnstile when token provided
    - Test forgotPassword throws error when token required but missing
    - Test forgotPassword proceeds without token when secret key not set
    - _Requirements: 2.3, 2.5_

- [x] 9. Checkpoint - Test backend integration
  - Ensure backend accepts captchaToken in all auth endpoints
  - Verify verification is called before authentication logic
  - Verify error handling returns correct status codes
  - Ask the user if questions arise

- [ ] 10. Write property-based tests for backend verification
  - [ ]\* 10.1 Write property test for verification before authentication
    - **Property 3: Verification Before Authentication**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]\* 10.2 Write property test for failed verification response
    - **Property 4: Failed Verification Returns 403**
    - **Validates: Requirements 2.4, 2.5**

  - [ ]\* 10.3 Write property test for server-side verification
    - **Property 10: Server-Side Verification Required**
    - **Validates: Requirements 9.3**

  - [ ]\* 10.4 Write property test for secret key exposure
    - **Property 8: Secret Key Never Exposed**
    - **Validates: Requirements 9.1**

  - [ ]\* 10.5 Write property test for single-use tokens
    - **Property 9: Single-Use Token Validation**
    - **Validates: Requirements 9.2**

  - [ ]\* 10.6 Write property test for verification logging
    - **Property 11: Failed Verification Logging**
    - **Validates: Requirements 9.5**

  - [ ]\* 10.7 Write property test for network error handling
    - **Property 12: Network Error Handling**
    - **Validates: Requirements 10.1**

- [ ] 11. Write property-based tests for frontend behavior
  - [ ]\* 11.1 Write property test for token storage
    - **Property 2: Token Storage After Generation**
    - **Validates: Requirements 1.5**

  - [ ]\* 11.2 Write property test for form submission validation
    - **Property 5: Form Submission Requires Token**
    - **Validates: Requirements 5.4, 6.4**

  - [ ]\* 11.3 Write property test for widget reset
    - **Property 6: Widget Reset After Authentication Failure**
    - **Validates: Requirements 5.5**

  - [ ]\* 11.4 Write property test for retry after network failure
    - **Property 13: Retry After Network Failure**
    - **Validates: Requirements 10.3**

- [ ] 12. Write integration tests
  - [ ]\* 12.1 Write end-to-end login flow test
    - Test complete login with valid CAPTCHA token
    - Test login rejection with invalid token
    - Test login without token when secret key not configured
    - _Requirements: 1.2, 2.1, 5.1_

  - [ ]\* 12.2 Write end-to-end registration flow test
    - Test complete registration with valid CAPTCHA token
    - Test registration rejection with invalid token
    - _Requirements: 1.3, 2.2, 5.1_

  - [ ]\* 12.3 Write end-to-end forgot password flow test
    - Test forgot password with valid CAPTCHA token
    - Test forgot password rejection with invalid token
    - _Requirements: 1.4, 2.3, 5.1_

  - [ ]\* 12.4 Write widget lifecycle test
    - Test widget render → token generation → submission → reset
    - Test token expiration and regeneration
    - _Requirements: 1.1, 1.5, 5.5_

- [x] 13. Update documentation
  - [x] 13.1 Update backend .env.example
    - Add TURNSTILE_SECRET_KEY with documentation
    - Include link to Cloudflare dashboard
    - Document test key for development
    - _Requirements: 3.5_

  - [x] 13.2 Update web-app .env.example
    - Ensure VITE_TURNSTILE_SITE_KEY is documented
    - Include link to Cloudflare dashboard
    - Document test key for development
    - _Requirements: 3.5_

  - [x] 13.3 Document mobile implementation strategy
    - Add section to README about React Native limitations
    - Document WebView approach recommendation
    - Note that mobile can work without CAPTCHA initially
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 13.4 Create testing guide
    - Document how to use Cloudflare test keys
    - Document how to obtain production keys
    - Document manual testing checklist
    - _Requirements: 8.4_

- [x] 14. Final checkpoint - End-to-end testing
  - Test with Cloudflare test keys (always pass)
  - Verify all three flows (login, registration, forgot password)
  - Verify error handling for all failure scenarios
  - Verify graceful degradation when secret key not set
  - Verify widget reset and retry functionality
  - Ask the user if ready for production deployment

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The backend already has `AuthService.verifyTurnstile()` implemented, so no changes needed there
- The backend controller already has verification logic for login and registration
- Focus is on adding forgot password support and frontend integration
- Property tests should run minimum 100 iterations each
- Use Cloudflare test keys for development: Site Key `1x00000000000000000000AA`, Secret Key `1x0000000000000000000000000000000AA`
- Each property test must reference its design document property with a comment tag
