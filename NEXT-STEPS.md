# Next Steps - Google OAuth Setup

## ✅ Yang Sudah Selesai

1. ✅ Refactor semua AI prompts menggunakan `parseWithRetry`
2. ✅ Implementasi Google OAuth untuk signup dan login
3. ✅ Environment variables sudah diset di `.env.local`
4. ✅ Build berhasil tanpa error
5. ✅ Dokumentasi lengkap dibuat

---

## 🔧 Yang Perlu Dilakukan

### 1. Konfigurasi Google Cloud Console

**Langkah**:
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project Anda
3. Navigasi ke **APIs & Services** → **Credentials**
4. Klik OAuth 2.0 Client ID yang sudah ada
5. Tambahkan **Authorized redirect URIs**:
   ```
   https://sekpri-ai-pi.vercel.app/api/auth/callback/google
   https://sekpri-ai-pi.vercel.app/api/auth/callback/gmail
   ```
6. Jika menggunakan localhost untuk development, tambahkan juga:
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3000/api/auth/callback/gmail
   ```
7. Klik **Save**

**Verifikasi**:
- ✅ Redirect URIs sudah ditambahkan
- ✅ OAuth consent screen sudah dikonfigurasi
- ✅ Scopes: `openid`, `email`, `profile`

---

### 2. Konfigurasi Supabase

**Langkah**:
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Navigasi ke **Authentication** → **Providers**
4. Cari **Google** dan klik untuk enable
5. Masukkan credentials:
   ```
   Client ID: 231866780896-hik4ht73k4s6fo5jdpebskc1tal7hpv4.apps.googleusercontent.com
   Client Secret: GOCSPX-t7mqy... (dari .env.local)
   ```
6. Copy **Callback URL** yang ditampilkan
7. Tambahkan Callback URL tersebut ke Google Cloud Console redirect URIs
8. Klik **Save**

**Site URL Configuration**:
1. Navigasi ke **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://sekpri-ai-pi.vercel.app`
3. Add **Redirect URLs**:
   ```
   https://sekpri-ai-pi.vercel.app/inbox
   https://sekpri-ai-pi.vercel.app/settings
   ```
4. Klik **Save**

**Verifikasi**:
- ✅ Google provider enabled
- ✅ Client ID dan Secret sudah diset
- ✅ Site URL sudah dikonfigurasi
- ✅ Redirect URLs sudah ditambahkan

---

### 3. Test di Development

**Langkah**:
```bash
# 1. Start development server
npm run dev

# 2. Buka browser
# http://localhost:3000/signup

# 3. Klik "Continue with Google"

# 4. Pilih Google account

# 5. Authorize aplikasi

# 6. Harus redirect ke http://localhost:3000/inbox
```

**Troubleshooting**:
- Jika error "redirect_uri_mismatch":
  - Pastikan redirect URI di Google Cloud Console match persis
  - Check untuk trailing slash
  - Pastikan protocol (http/https) sesuai

- Jika error "invalid_client":
  - Verify GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET
  - Restart dev server setelah update .env.local

- Jika user tidak dibuat di Supabase:
  - Check Supabase logs di dashboard
  - Verify Google provider enabled
  - Check Site URL configuration

---

### 4. Deploy ke Production

**Vercel Environment Variables**:
1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project `sekpri-ai-pi`
3. Navigasi ke **Settings** → **Environment Variables**
4. Verify variables sudah diset:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   NEXT_PUBLIC_APP_URL=https://sekpri-ai-pi.vercel.app
   ```
5. Jika belum, tambahkan variables tersebut

**Deploy**:
```bash
# Option 1: Deploy via Git
git add .
git commit -m "feat: add Google OAuth for signup/login"
git push origin main

# Option 2: Deploy via Vercel CLI
vercel --prod
```

**Test di Production**:
1. Buka `https://sekpri-ai-pi.vercel.app/signup`
2. Klik "Continue with Google"
3. Authorize aplikasi
4. Harus redirect ke `https://sekpri-ai-pi.vercel.app/inbox`

---

### 5. Monitoring

**Google Cloud Console**:
- Monitor OAuth usage di **APIs & Services** → **Credentials**
- Check error logs jika ada masalah

**Supabase**:
- Monitor auth logs di **Authentication** → **Logs**
- Check user creation di **Authentication** → **Users**

**Vercel**:
- Monitor function logs di **Deployments** → [deployment] → **Functions**
- Check error logs untuk OAuth callbacks

---

## 📋 Checklist

### Pre-Deployment
- [x] Refactor AI prompts
- [x] Implement Google OAuth
- [x] Build berhasil
- [ ] Test di development
- [ ] Konfigurasi Google Cloud Console
- [ ] Konfigurasi Supabase
- [ ] Test OAuth flow di development

### Deployment
- [ ] Verify Vercel environment variables
- [ ] Deploy ke production
- [ ] Test OAuth flow di production
- [ ] Monitor logs untuk errors

### Post-Deployment
- [ ] Test dengan multiple Google accounts
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test error handling (cancelled auth, invalid state)
- [ ] Test pada mobile/tablet
- [ ] Update dokumentasi jika ada perubahan

---

## 🆘 Support

Jika ada masalah:

1. **Check Documentation**:
   - `docs/google-oauth-setup.md` - Setup guide lengkap
   - `REFACTOR-SUMMARY.md` - Summary perubahan
   - `docs/refactor-changelog.md` - Changelog detail

2. **Verify Configuration**:
   ```bash
   node scripts/verify-google-oauth.mjs
   ```

3. **Check Logs**:
   - Vercel function logs
   - Supabase auth logs
   - Browser console errors

4. **Common Issues**:
   - Redirect URI mismatch → Check Google Cloud Console
   - Invalid client → Check environment variables
   - User not created → Check Supabase configuration

---

## 🎉 Success Criteria

OAuth implementation dianggap berhasil jika:

- ✅ User bisa signup dengan Google
- ✅ User bisa login dengan Google
- ✅ User otomatis dibuat di Supabase
- ✅ Redirect ke inbox setelah auth
- ✅ Session persisted (tidak logout setelah refresh)
- ✅ Error handling bekerja dengan baik
- ✅ Bekerja di desktop dan mobile

---

## 📞 Contact

Jika butuh bantuan lebih lanjut, hubungi:
- Developer: [Your contact]
- Documentation: `docs/google-oauth-setup.md`
- Issues: GitHub Issues

---

**Status**: Ready for configuration and testing! 🚀

**Estimated Time**: 30-60 minutes untuk setup dan testing
