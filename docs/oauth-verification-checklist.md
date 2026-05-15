# Google OAuth Verification Checklist

## Overview
This checklist helps you prepare for Google OAuth verification to move your app from "Testing" to "Production" status.

---

## ✅ Required Pages (COMPLETED)

### 1. Privacy Policy
- ✅ **URL**: `https://sekpri-ai-pi.vercel.app/privacy`
- ✅ **Status**: Created and deployed
- ✅ **Content includes**:
  - What data we collect
  - How we use data
  - AI processing disclosure
  - Google API Services User Data Policy compliance
  - Data sharing and security
  - User rights (access, deletion, portability)
  - Contact information

### 2. Terms of Service
- ✅ **URL**: `https://sekpri-ai-pi.vercel.app/terms`
- ✅ **Status**: Created and deployed
- ✅ **Content includes**:
  - Service description
  - Account terms
  - Email access permissions
  - AI features and limitations
  - Acceptable use policy
  - Disclaimers and liability
  - Contact information

### 3. Homepage
- ✅ **URL**: `https://sekpri-ai-pi.vercel.app`
- ✅ **Status**: Live with footer links to Privacy and Terms
- ✅ **Features**:
  - Clear description of the app
  - Links to Privacy Policy and Terms of Service in footer
  - Professional branding

---

## 📋 OAuth Consent Screen Configuration

### App Information
```
App name: sekpriAI
User support email: [Your support email]
Developer contact email: [Your email]
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
(or your custom domain)
```

### App Logo
- Upload a 120x120px (minimum) logo
- Use your `/public/logo.png` file
- Must be square and clear

---

## 🔐 Scopes Configuration

### For User Authentication (Signup/Login)
```
openid
email
profile
```

**Justification**: Required for user authentication via Google OAuth.

### For Gmail Integration (Email Management)
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.modify
```

**Justification**: 
- `gmail.readonly` - Read emails for unified inbox display
- `gmail.send` - Send emails on user's behalf (with approval)
- `gmail.modify` - Update labels and read status

---

## 📝 Verification Submission

### Step 1: Complete OAuth Consent Screen
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Fill in all required fields:
   - App information
   - App domain (homepage, privacy, terms)
   - Authorized domains
   - Developer contact information
4. Upload app logo
5. Click **Save and Continue**

### Step 2: Configure Scopes
1. Click **Add or Remove Scopes**
2. Add the scopes listed above
3. Provide justification for each scope
4. Click **Update** and **Save and Continue**

### Step 3: Add Test Users (if in Testing mode)
1. Add test user emails
2. These users can use the app while in Testing mode
3. Click **Save and Continue**

### Step 4: Submit for Verification (Optional)
If you want to move from "Testing" to "Production":

1. Click **Publish App** on OAuth consent screen
2. Google will review your app
3. Provide additional information if requested:
   - YouTube video demo (optional but recommended)
   - Detailed scope justification
   - Privacy policy and terms compliance

**Note**: Apps in "Testing" mode can have up to 100 test users and work fine for private use. Only submit for verification if you need public access.

---

## 🎥 Demo Video (Optional)

If submitting for verification, create a short video showing:

1. **User signup/login flow**:
   - Click "Continue with Google"
   - Google OAuth consent screen
   - Successful login

2. **Gmail integration**:
   - Connect Gmail account
   - Show unified inbox
   - Display email reading

3. **AI features**:
   - Email summarization
   - Priority classification
   - Draft reply generation (with approval)

4. **Data privacy**:
   - Show that AI never sends without approval
   - Demonstrate account disconnection
   - Show data deletion

**Video requirements**:
- Upload to YouTube (unlisted is fine)
- 2-5 minutes long
- Clear audio and screen recording
- Show actual app functionality

---

## 📧 Verification Questions & Answers

### Q: Why does your app need Gmail access?
**A**: sekpriAI is an AI-powered email management platform that provides a unified inbox for multiple email providers. Gmail access is required to:
- Display emails in the unified inbox
- Provide AI-powered summaries and prioritization
- Send emails on behalf of the user (with explicit approval)
- Update email labels and read status

### Q: How do you protect user data?
**A**: We implement multiple security measures:
- All OAuth tokens encrypted with AES-256-GCM
- HTTPS/TLS for all data transmission
- Row Level Security in database
- No data sharing with advertisers
- Compliance with Google API Services User Data Policy
- Human-in-the-loop for all sensitive actions

### Q: Do you use Gmail data for advertising?
**A**: No. We do not use Gmail data for advertising purposes. We only use Gmail data to provide our email management service.

### Q: Can humans read user emails?
**A**: No. We do not allow humans to read user emails except:
- For security purposes (investigating abuse)
- For compliance with legal obligations
- With explicit user consent (support requests)

### Q: How can users revoke access?
**A**: Users can revoke access at any time by:
- Disconnecting their Gmail account in app settings
- Revoking OAuth permissions in Google Account settings
- Deleting their account entirely

---

## ✅ Pre-Verification Checklist

Before submitting for verification, ensure:

- [ ] Privacy Policy is live and accessible
- [ ] Terms of Service is live and accessible
- [ ] Homepage clearly describes the app
- [ ] Footer links to Privacy and Terms work
- [ ] OAuth consent screen is complete
- [ ] All scopes have justifications
- [ ] App logo is uploaded (120x120px minimum)
- [ ] Authorized domains are added
- [ ] Redirect URIs are correct
- [ ] App is tested with multiple Google accounts
- [ ] Demo video is created (if submitting for verification)
- [ ] All features work as described
- [ ] No broken links or errors

---

## 🚀 Testing Mode vs Production

### Testing Mode (Current)
- ✅ Up to 100 test users
- ✅ No verification required
- ✅ Full functionality
- ❌ Users see "unverified app" warning
- ❌ Limited to test users only

### Production Mode (After Verification)
- ✅ Unlimited users
- ✅ No "unverified app" warning
- ✅ Public access
- ⏱️ Requires Google review (1-6 weeks)

**Recommendation**: Stay in Testing mode unless you need public access. Testing mode is sufficient for private use and beta testing.

---

## 📞 Support

If you have questions during verification:

- **Google OAuth Support**: [Google Cloud Support](https://cloud.google.com/support)
- **Documentation**: [OAuth Verification Guide](https://support.google.com/cloud/answer/9110914)
- **Privacy Policy**: `https://sekpri-ai-pi.vercel.app/privacy`
- **Terms of Service**: `https://sekpri-ai-pi.vercel.app/terms`

---

## 🎉 Summary

**Status**: ✅ Ready for OAuth verification

**What's Done**:
- ✅ Privacy Policy page created
- ✅ Terms of Service page created
- ✅ Footer links added to homepage
- ✅ Professional branding
- ✅ Google API Services User Data Policy compliance

**Next Steps**:
1. Deploy to production (if not already)
2. Configure OAuth consent screen in Google Cloud Console
3. Add Privacy Policy and Terms links
4. Upload app logo
5. Test with multiple Google accounts
6. (Optional) Submit for verification if you need public access

**Estimated Time**: 30-60 minutes for configuration, 1-6 weeks for verification (if submitting)
