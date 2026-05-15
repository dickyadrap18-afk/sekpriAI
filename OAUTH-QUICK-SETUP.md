# Google OAuth Quick Setup Guide

## 🎯 Quick Reference

Gunakan informasi ini untuk mengisi OAuth consent screen di Google Cloud Console.

---

## 📋 Copy-Paste Values

### App Information
```
App name: sekpriAI
User support email: [YOUR_EMAIL]
Developer contact email: [YOUR_EMAIL]
```

### App Domain
```
Application home page: https://sekpri-ai-pi.vercel.app
Application privacy policy: https://sekpri-ai-pi.vercel.app/privacy
Application terms of service: https://sekpri-ai-pi.vercel.app/terms
```

### Authorized Domains
```
sekpri-ai-pi.vercel.app
```

### Authorized Redirect URIs
```
https://sekpri-ai-pi.vercel.app/auth/callback
https://sekpri-ai-pi.vercel.app/api/auth/callback/gmail
http://localhost:3000/auth/callback
http://localhost:3000/api/auth/callback/gmail
```

**Note**: `/auth/callback` is for user authentication (signup/login), `/api/auth/callback/gmail` is for Gmail integration.

---

## 🔐 Scopes

### For User Authentication (Signup/Login)
```
openid
email
profile
```

**Justification**: 
```
Required for user authentication via Google OAuth. We use this to create user accounts and provide secure login.
```

### For Gmail Integration (Email Management)
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.modify
```

**Justification**:
```
gmail.readonly: Read emails to display in unified inbox and provide AI-powered summaries and prioritization.

gmail.send: Send emails on behalf of the user with explicit approval. AI never sends without user confirmation.

gmail.modify: Update email labels and read status to provide email management features.
```

---

## 🎨 App Logo

Upload file: `/public/logo.png`

Requirements:
- Minimum 120x120px
- Square format
- Clear and professional

---

## ⚡ Quick Steps

### 1. Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**

### 2. Fill Basic Info
- Copy-paste App name, emails from above
- Upload logo from `/public/logo.png`

### 3. Add App Domain
- Copy-paste all three URLs (homepage, privacy, terms)
- Add authorized domain

### 4. Add Scopes
- Click "Add or Remove Scopes"
- Add all 6 scopes listed above
- Copy-paste justifications

### 5. Save
- Click "Save and Continue"
- Review summary
- Click "Back to Dashboard"

---

## ✅ Verification

After setup, test:

1. Go to: https://sekpri-ai-pi.vercel.app/signup
2. Click "Continue with Google"
3. Should see:
   - ✅ App name: sekpriAI
   - ✅ App logo
   - ✅ Privacy Policy link
   - ✅ Terms of Service link
   - ✅ Requested permissions

---

## 🆘 Troubleshooting

### "redirect_uri_mismatch"
- Check redirect URIs match exactly
- No trailing slashes
- Correct protocol (http/https)

### "invalid_client"
- Verify GOOGLE_CLIENT_ID in .env.local
- Restart dev server

### Privacy/Terms links not working
- Deploy to production first
- Verify pages are accessible

---

## 📞 Need Help?

- Documentation: `docs/oauth-verification-checklist.md`
- Full guide: `docs/google-oauth-setup.md`
- Summary: `PRIVACY-TERMS-SUMMARY.md`

---

**Estimated Time**: 15-30 minutes ⏱️
