# Google OAuth Setup Guide

## Overview
This guide explains how to configure Google OAuth for both:
1. **User Authentication** (Sign up / Sign in with Google)
2. **Gmail Integration** (Connect Gmail account for email management)

## Prerequisites
- Google Cloud Console project
- Supabase project
- Environment variables configured

## 1. Google Cloud Console Setup

### Create OAuth 2.0 Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if not done already

### Configure OAuth Client
- **Application type**: Web application
- **Name**: sekpriAI (or your app name)
- **Authorized JavaScript origins**:
  - `http://localhost:3000` (development)
  - `https://your-domain.com` (production)
- **Authorized redirect URIs**:
  - `http://localhost:3000/auth/callback` (Supabase OAuth callback - development)
  - `http://localhost:3000/api/auth/callback/gmail` (Gmail integration - development)
  - `https://your-domain.com/auth/callback` (Supabase OAuth callback - production)
  - `https://your-domain.com/api/auth/callback/gmail` (Gmail integration - production)
  - `https://your-supabase-project.supabase.co/auth/v1/callback` (Supabase direct)

### OAuth Consent Screen
Configure the OAuth consent screen with:
- **App name**: sekpriAI
- **User support email**: Your support email
- **App logo**: Upload your logo (120x120px minimum)
- **Application home page**: `https://your-domain.com`
- **Application privacy policy link**: `https://your-domain.com/privacy`
- **Application terms of service link**: `https://your-domain.com/terms`
- **Authorized domains**: Add your domain (e.g., `your-domain.com`)

**Important**: Privacy Policy and Terms of Service pages are **required** for OAuth verification. These pages are already created at:
- `/privacy` - Privacy Policy page
- `/terms` - Terms of Service page

### Required Scopes
For user authentication:
- `openid`
- `email`
- `profile`

For Gmail integration (additional):
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.modify`

## 2. Supabase Configuration

### Enable Google Provider
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and enable it
4. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Copy the **Callback URL** and add it to Google Cloud Console redirect URIs

### Configure Site URL
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your app URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Add **Redirect URLs**:
   - `http://localhost:3000/inbox`
   - `https://your-domain.com/inbox`

## 3. Environment Variables

Add to `.env.local` (development) and Vercel (production):

```env
# Google OAuth (for both user auth and Gmail)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
```

## 4. Testing

### Test User Authentication
1. Go to `/signup` or `/login`
2. Click "Continue with Google"
3. Select a Google account
4. Should redirect to `/inbox` after successful authentication

### Test Gmail Integration
1. Sign in to the app
2. Go to `/settings`
3. Click "Connect Gmail"
4. Authorize Gmail access
5. Should see Gmail account connected

## 5. Troubleshooting

### "redirect_uri_mismatch" Error
- Verify redirect URIs in Google Cloud Console match exactly
- Check for trailing slashes
- Ensure protocol (http/https) matches

### "invalid_client" Error
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check environment variables are loaded

### "access_denied" Error
- User cancelled the OAuth flow
- Check OAuth consent screen configuration
- Verify required scopes are requested

### User Not Created in Supabase
- Check Supabase logs in dashboard
- Verify Google provider is enabled
- Ensure email is verified in Google account

## 6. Security Notes

- Never commit `.env.local` to version control
- Use different OAuth clients for development and production
- Regularly rotate client secrets
- Monitor OAuth usage in Google Cloud Console
- Enable 2FA for Google Cloud Console access

## 7. Production Deployment

### Vercel Environment Variables
Set in Vercel dashboard:
1. Go to project settings → Environment Variables
2. Add all required variables
3. Deploy

### Update Redirect URIs
After deploying to production:
1. Update Google Cloud Console redirect URIs with production URLs
2. Update Supabase URL configuration
3. Test OAuth flow in production

## References
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
