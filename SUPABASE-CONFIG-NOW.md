# Konfigurasi Supabase — WAJIB DILAKUKAN SEKARANG

## Masalah yang Terjadi

URL setelah Google OAuth:
```
https://sekpri-ai-pi.vercel.app/login?code=bd7220c7-...
```

Seharusnya:
```
https://sekpri-ai-pi.vercel.app/auth/callback?code=bd7220c7-...
```

**Root cause**: Supabase mengirim code ke Site URL (`/`) lalu redirect ke `/login`.
Middleware sekarang sudah menangkap ini dan forward ke `/auth/callback` secara otomatis.
Tapi agar lebih bersih, Supabase juga harus tahu bahwa `/auth/callback` adalah redirect URL yang valid.

---

## Yang Harus Dilakukan di Supabase Dashboard

### Buka: https://supabase.com/dashboard/project/bggzhfujjotofotctspy/auth/url-configuration

### 1. Site URL
```
https://sekpri-ai-pi.vercel.app
```

### 2. Redirect URLs — Tambahkan SEMUA ini:
```
https://sekpri-ai-pi.vercel.app/auth/callback
https://sekpri-ai-pi.vercel.app/auth/callback/**
https://sekpri-ai-pi.vercel.app/**
http://localhost:3000/auth/callback
http://localhost:3000/**
```

Klik **Save**.

---

### 3. Google Provider — Pastikan sudah diisi:

Buka: https://supabase.com/dashboard/project/bggzhfujjotofotctspy/auth/providers

- **Enable**: ✅ ON
- **Client ID**: `231866780896-hik4ht73k4s6fo5jdpebskc1tal7hpv4.apps.googleusercontent.com`
- **Client Secret**: (dari .env.local — nilai GOOGLE_CLIENT_SECRET)

Klik **Save**.

---

### 4. Google Cloud Console — Tambahkan Redirect URI

Buka: https://console.cloud.google.com/apis/credentials

Edit OAuth 2.0 Client ID, tambahkan ke **Authorized redirect URIs**:
```
https://bggzhfujjotofotctspy.supabase.co/auth/v1/callback
https://sekpri-ai-pi.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

Klik **Save**.

---

## Alur Setelah Fix

```
User klik "Continue with Google"
    ↓
Supabase redirect ke Google OAuth
    ↓
Google redirect ke: https://bggzhfujjotofotctspy.supabase.co/auth/v1/callback
    ↓
Supabase exchange code, lalu redirect ke: https://sekpri-ai-pi.vercel.app/auth/callback?code=...
    ↓
/auth/callback handler: exchangeCodeForSession → set cookies
    ↓
Redirect ke /inbox ✅
```

---

## Fallback (sudah aktif)

Bahkan jika Supabase masih mengirim code ke `/login`, middleware sekarang otomatis forward ke `/auth/callback`:

```
/login?code=xxx  →  middleware  →  /auth/callback?code=xxx  →  /inbox ✅
```

Jadi flow akan bekerja dalam kedua kasus.
