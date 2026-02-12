# Cloudflare Turnstile CAPTCHA Testing Guide

This guide provides instructions for testing the Cloudflare Turnstile CAPTCHA implementation in the Horizon Tasks application.

## Table of Contents

1. [Test Keys](#test-keys)
2. [Obtaining Production Keys](#obtaining-production-keys)
3. [Development Testing](#development-testing)
4. [Manual Testing Checklist](#manual-testing-checklist)
5. [Troubleshooting](#troubleshooting)

## Test Keys

Cloudflare provides test keys that always pass verification. These are useful for development and testing without requiring a real Cloudflare account.

### Test Site Key (Frontend)

```
1x00000000000000000000AA
```

### Test Secret Key (Backend)

```
1x0000000000000000000000000000000AA
```

### Configuration

**Backend (.env):**

```bash
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

**Frontend (.env):**

```bash
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

**Note:** Test keys will always pass verification, regardless of the token value. This allows you to test the integration without real CAPTCHA challenges.

## Obtaining Production Keys

To use Cloudflare Turnstile in production, you need to create a Turnstile site in the Cloudflare Dashboard.

### Steps:

1. **Log in to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com
   - Sign in with your Cloudflare account (create one if needed)

2. **Navigate to Turnstile**
   - Go to: https://dash.cloudflare.com/?to=/:account/turnstile
   - Or click "Turnstile" in the left sidebar

3. **Create a New Site**
   - Click "Add Site" button
   - Fill in the configuration:
     - **Site Name:** "Horizon Tasks - Login/Registration" (or your preferred name)
     - **Domain:** Add your production domain(s) (e.g., `app.example.com`)
     - **Widget Mode:** Select "Managed" (recommended for minimal user friction)
     - **Widget Type:** Select "Invisible" or "Managed"

4. **Copy Your Keys**
   - After creating the site, you'll see:
     - **Site Key** (public key for frontend)
     - **Secret Key** (private key for backend)
   - Copy both keys to your environment variables

5. **Configure Environment Variables**

   **Backend (.env):**

   ```bash
   TURNSTILE_SECRET_KEY=your-production-secret-key-here
   ```

   **Frontend (.env):**

   ```bash
   VITE_TURNSTILE_SITE_KEY=your-production-site-key-here
   ```

6. **Deploy and Test**
   - Deploy your application with the production keys
   - Test authentication flows on your production domain
   - Monitor verification success/failure rates in Cloudflare Dashboard

## Development Testing

### Testing with Test Keys

1. **Configure Test Keys**
   - Set test keys in your `.env` files (see [Test Keys](#test-keys) section)
   - Restart your backend and frontend servers

2. **Verify Widget Loads**
   - Navigate to the login page
   - The Turnstile widget should render (may be invisible in managed mode)
   - Check browser console for any errors

3. **Test Login Flow**
   - Enter valid credentials
   - Submit the form
   - Widget should generate a token automatically
   - Login should succeed

4. **Test Registration Flow**
   - Click "Register" or switch to registration mode
   - Enter email address
   - Submit the form
   - Widget should generate a token
   - OTP should be sent

5. **Test Forgot Password Flow**
   - Click "Forgot Password"
   - Enter email address
   - Submit the form
   - Widget should generate a token
   - Reset OTP should be sent

### Testing Without CAPTCHA

To test the application without CAPTCHA (development mode):

1. **Remove Secret Key from Backend**
   - Comment out or remove `TURNSTILE_SECRET_KEY` from backend `.env`
   - Restart backend server

2. **Verify Behavior**
   - Backend will log: "TURNSTILE_SECRET_KEY not set. Skipping verification."
   - Authentication requests will proceed without CAPTCHA verification
   - Frontend widget will still render (if site key is set)

3. **Use Case**
   - Useful for local development
   - Allows mobile app to authenticate without CAPTCHA
   - Simplifies testing of other features

## Manual Testing Checklist

### Frontend Widget Tests

- [ ] **Widget Initialization**
  - [ ] Widget renders on login page
  - [ ] Widget uses correct site key from environment
  - [ ] No console errors during widget load

- [ ] **Widget Modes**
  - [ ] Managed mode is configured (minimal user interaction)
  - [ ] Theme adapts to system preferences (auto theme)
  - [ ] Widget is visible but unobtrusive

- [ ] **Token Generation**
  - [ ] Token is generated automatically for legitimate users
  - [ ] Token is stored in component state
  - [ ] Token is included in authentication requests

- [ ] **Error Handling**
  - [ ] Missing site key displays error message
  - [ ] Widget load failure shows appropriate error
  - [ ] Network errors are handled gracefully

### Backend Verification Tests

- [ ] **Login Endpoint**
  - [ ] Valid token allows login to proceed
  - [ ] Invalid token returns 403 Forbidden
  - [ ] Missing token (when required) returns 400 Bad Request
  - [ ] Missing secret key allows login without verification

- [ ] **Registration Endpoint**
  - [ ] Valid token allows registration to proceed
  - [ ] Invalid token returns 403 Forbidden
  - [ ] Missing token (when required) returns 400 Bad Request

- [ ] **Forgot Password Endpoint**
  - [ ] Valid token allows password reset to proceed
  - [ ] Invalid token returns 403 Forbidden
  - [ ] Missing token (when required) returns 400 Bad Request

### Integration Tests

- [ ] **Complete Authentication Flows**
  - [ ] Login with valid CAPTCHA token succeeds
  - [ ] Registration with valid CAPTCHA token succeeds
  - [ ] Forgot password with valid CAPTCHA token succeeds

- [ ] **Widget Reset**
  - [ ] Widget resets after authentication failure
  - [ ] New token is generated after reset
  - [ ] User can retry after failure

- [ ] **Token Expiration**
  - [ ] Token expires after 5 minutes
  - [ ] Expired token triggers widget reset
  - [ ] New token is generated automatically

### Security Tests

- [ ] **Secret Key Protection**
  - [ ] Secret key is never exposed in API responses
  - [ ] Secret key is only in backend environment
  - [ ] Frontend only has site key (public)

- [ ] **Single-Use Tokens**
  - [ ] Token can only be verified once
  - [ ] Reusing token returns verification failure

- [ ] **Server-Side Verification**
  - [ ] Backend always verifies tokens with Cloudflare
  - [ ] Client-side validation is not trusted
  - [ ] Verification happens before authentication logic

### Production Tests

- [ ] **Production Keys**
  - [ ] Production site key works on production domain
  - [ ] Production secret key verifies tokens correctly
  - [ ] Widget displays correctly on production

- [ ] **Performance**
  - [ ] Widget loads quickly (< 2 seconds)
  - [ ] Verification completes quickly (< 1 second)
  - [ ] No noticeable impact on user experience

- [ ] **Monitoring**
  - [ ] Verification success rate is tracked
  - [ ] Failed verifications are logged
  - [ ] Alerts are set up for high failure rates

## Troubleshooting

### Widget Not Rendering

**Symptoms:**

- Widget doesn't appear on login page
- Console shows "CAPTCHA not configured" error

**Solutions:**

1. Check that `VITE_TURNSTILE_SITE_KEY` is set in frontend `.env`
2. Restart frontend development server
3. Clear browser cache and reload page
4. Verify site key is correct (no typos)

### Verification Always Fails

**Symptoms:**

- All authentication attempts return 403 Forbidden
- Backend logs show "Turnstile verification failed"

**Solutions:**

1. Check that `TURNSTILE_SECRET_KEY` is set in backend `.env`
2. Verify secret key is correct (no typos)
3. Ensure backend can reach Cloudflare API (check firewall)
4. Check that token is being sent from frontend
5. Try using test keys to isolate the issue

### Token Not Included in Request

**Symptoms:**

- Backend logs show "CAPTCHA token required"
- Frontend doesn't send token in request payload

**Solutions:**

1. Check that widget `onSuccess` callback is setting token state
2. Verify token is passed to authentication methods
3. Check browser console for JavaScript errors
4. Ensure widget has time to generate token before form submission

### Widget Loads But Token Not Generated

**Symptoms:**

- Widget renders but no token is generated
- Form submission is blocked with "Please complete the security verification"

**Solutions:**

1. Check browser console for Turnstile errors
2. Verify site key is valid and not expired
3. Check that domain matches Turnstile site configuration
4. Try using test site key to isolate the issue
5. Check network tab for failed Cloudflare API requests

### Backend Can't Reach Cloudflare API

**Symptoms:**

- Backend logs show network errors
- Verification times out after 5 seconds

**Solutions:**

1. Check backend server has internet access
2. Verify firewall allows outbound HTTPS to Cloudflare
3. Check DNS resolution for `challenges.cloudflare.com`
4. Try pinging Cloudflare API from backend server
5. Check for proxy or VPN issues

### Production Keys Don't Work

**Symptoms:**

- Test keys work but production keys fail
- Widget shows "Invalid site key" error

**Solutions:**

1. Verify production domain is added to Turnstile site configuration
2. Check that you're testing on the correct domain
3. Ensure site key and secret key are from the same Turnstile site
4. Verify keys are not expired or revoked
5. Check Cloudflare Dashboard for site status

### Mobile App Can't Authenticate

**Symptoms:**

- Mobile app authentication fails with CAPTCHA errors
- Web app works fine

**Solutions:**

1. Remove `TURNSTILE_SECRET_KEY` from backend `.env` to disable CAPTCHA requirement
2. Or implement WebView-based CAPTCHA for mobile (see mobile implementation strategy)
3. Verify backend logs show "Skipping verification" for mobile requests
4. Check that mobile app is hitting the correct backend URL

## Additional Resources

- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [Turnstile Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)
- [@marsidev/react-turnstile GitHub](https://github.com/marsidev/react-turnstile)
- [Design Document](.kiro/specs/cloudflare-turnstile-captcha/design.md)
- [Requirements Document](.kiro/specs/cloudflare-turnstile-captcha/requirements.md)

## Support

If you encounter issues not covered in this guide:

1. Check the Cloudflare Turnstile Dashboard for error details
2. Review backend logs for verification failures
3. Check browser console for frontend errors
4. Consult the design document for implementation details
5. Contact Cloudflare support for Turnstile-specific issues
