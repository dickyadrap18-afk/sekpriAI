# Refactor Changelog

## Date: 2025-05-15

### 1. Refactored AI Prompts to Use `parseWithRetry`

**Problem**: Duplicated JSON parsing and retry logic across multiple AI prompt modules.

**Solution**: Refactored all prompt files to use the centralized `parseWithRetry` utility function.

**Files Modified**:
- `features/ai/prompts/draft-reply.ts`
- `features/ai/prompts/extract-memory.ts`
- `features/ai/prompts/parse-channel-intent.ts`
- `features/ai/prompts/priority.ts`
- `features/ai/prompts/risk.ts`

**Benefits**:
- ✅ Eliminated code duplication
- ✅ Consistent error handling across all AI prompts
- ✅ Easier to maintain and update retry logic
- ✅ Follows DRY (Don't Repeat Yourself) principle

**Reference**: Audit report CQ-04

---

### 2. Added Google OAuth for Signup and Login

**Problem**: Users could only sign up/login with email and password. No social authentication option.

**Solution**: Implemented Google OAuth for both signup and login flows.

**New Files Created**:
- `app/api/auth/callback/google/route.ts` - Handles OAuth callback
- `app/api/auth/login/google/route.ts` - Initiates Google login
- `app/api/auth/signup/google/route.ts` - Initiates Google signup
- `docs/google-oauth-setup.md` - Setup guide

**Files Modified**:
- `app/login/page.tsx` - Added "Continue with Google" button
- `app/signup/page.tsx` - Added "Continue with Google" button

**Features**:
- ✅ "Continue with Google" button on login page
- ✅ "Continue with Google" button on signup page
- ✅ OAuth state validation for CSRF protection
- ✅ Automatic user creation in Supabase
- ✅ Seamless redirect to inbox after authentication
- ✅ Works alongside existing email/password authentication

**Configuration Required**:
1. Google Cloud Console:
   - OAuth 2.0 Client ID configured
   - Redirect URIs added
   - Scopes: `openid`, `email`, `profile`

2. Supabase:
   - Google provider enabled
   - Client ID and Secret configured
   - Callback URL added

3. Environment Variables:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

**Security**:
- OAuth state parameter validation (SEC-05)
- HTTPS-only in production
- Secure cookie handling via Supabase SSR
- ID token verification

**User Flow**:
1. User clicks "Continue with Google"
2. Redirected to Google OAuth consent screen
3. User authorizes the app
4. Redirected back to app with authorization code
5. App exchanges code for tokens
6. User authenticated via Supabase
7. Redirected to `/inbox`

**Separation of Concerns**:
- `/api/auth/callback/google` - User authentication (signup/login)
- `/api/auth/callback/gmail` - Gmail integration (email account connection)

Both use the same Google OAuth credentials but serve different purposes.

---

## Testing Checklist

### AI Prompts Refactor
- [ ] Run `npm run typecheck` - should pass
- [ ] Test email summarization
- [ ] Test priority classification
- [ ] Test risk assessment
- [ ] Test draft reply generation
- [ ] Test memory extraction
- [ ] Test channel intent parsing

### Google OAuth
- [ ] Click "Continue with Google" on signup page
- [ ] Select Google account
- [ ] Verify redirect to `/inbox`
- [ ] Check user created in Supabase
- [ ] Logout and test login with Google
- [ ] Verify existing user can login
- [ ] Test error handling (cancelled auth, invalid state)
- [ ] Test on mobile/tablet (PWA)

---

## Deployment Notes

### Vercel Environment Variables
Ensure these are set in Vercel dashboard:
```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Google Cloud Console
Update redirect URIs with production URL:
```
https://your-domain.com/api/auth/callback/google
https://your-domain.com/api/auth/callback/gmail
```

### Supabase
Update Site URL and Redirect URLs in Authentication settings.

---

## Known Issues

None at this time.

---

## Future Improvements

1. Add Microsoft OAuth for signup/login
2. Add Apple Sign In
3. Add GitHub OAuth
4. Implement account linking (merge email/password with OAuth)
5. Add "Sign in with Google" on mobile app
6. Add OAuth token refresh handling
7. Add user profile sync from Google

---

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- Audit Report: `docs/audit-report.md` (CQ-04)
