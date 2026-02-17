# Project Roadmap

**Проект:** maxsa.dev
**Дата:** 2025-11-09
**Stack:** Next.js 16, React 19, Better Auth 5.x, PostgreSQL 17

---

## 📊 Current Status

### ✅ Completed (Foundation)

#### Authentication & Authorization

- [x] Better Auth 5.x integration
- [x] Email/Password authentication
- [x] Email verification (Resend + domain setup)
- [x] Server Actions (register, login, logout)
- [x] Protected routes (Server Components)
- [x] UserContext for Client Components
- [x] Role-based access (user/admin)
- [x] Auto-generated usernames
- [x] One-time name change logic
- [x] Proxy setup (вместо deprecated middleware)

#### UI/UX

- [x] Registration form (email + password only)
- [x] Login form
- [x] Change password form
- [x] Update name form
- [x] Validation strategy (onSubmit)
- [x] Error display (single error block + red borders)
- [x] Success indicators (green checkmarks ✓)
- [x] Password visibility toggle (eye icon)
- [x] Autofocus on first field
- [x] AutoComplete configuration
- [x] Responsive forms (vertical password fields)
- [x] Field persistence (React Hook Form)

#### Infrastructure

- [x] PostgreSQL schema setup
- [x] Server vs Client Component architecture
- [x] Dynamic menu (role-based: admin/user)
- [x] Sidebar navigation (Shadcn UI)
- [x] Breadcrumbs navigation

---

## 🚀 Advanced Authentication

### ✅ Priority 1: Two-Factor Authentication (2FA) - ✅ ЗАВЕРШЕНО

**Статус:** ✅ Повністю реалізовано з офіційним Better Auth 2FA Plugin

**Реалізація:**

- ✅ **Better Auth 2FA Plugin** - Офіційна інтеграція TOTP
- ✅ **Database schema** - Таблиця `twoFactor` (secret + backupCodes)
- ✅ **UI: Setup flow** - QR код → verify code → backup codes
- ✅ **UI: Login flow** - TOTP code або backup code
- ✅ **Backup Codes** - 10 одноразових кодів (8 символів, uppercase)
- ✅ **Regenerate Codes** - Можливість згенерувати нові backup коди
- ✅ **Enable/Disable** - Вмикання/вимикання 2FA з паролем

**Документація:** `docs/@authentication/`

**Файли:**

```typescript
// Server
lib/auth.ts                  // Plugin: twoFactor()
components/profile/two-factor-setup.tsx

// Client
lib/auth-client.ts           // Plugin: twoFactorClient()
components/auth/login-form.tsx (2FA verification integrated)
```

**Особливості:**

- Інтеграція 2FA **прямо в login form** (без редиректу на окрему сторінку)
- Backup codes зберігаються в `twoFactor.backupCodes` як JSON string
- Використовується `authClient.twoFactor.*` API

---

### ✅ Priority 2: Passkey (WebAuthn) - ✅ ЗАВЕРШЕНО

**Статус:** ✅ Повністю реалізовано з офіційним Better Auth Passkey Plugin

**Реалізація:**

- ✅ **Better Auth Passkey Plugin** - Офіційна інтеграція WebAuthn
- ✅ **Database schema** - Таблиця `passkey` з повною підтримкою WebAuthn L2
- ✅ **UI: Registration** - Додавання Passkey (Touch ID, Face ID, Security Keys)
- ✅ **UI: Login** - Вхід через Passkey (одна кнопка)
- ✅ **UI: Management** - Список, перейменування, видалення Passkey
- ✅ **Device Detection** - Автоматичне визначення типу пристрою (multiDevice/singleDevice)
- ✅ **Fallback** - Email/Password завжди доступні

**Документація:** `docs/@authentication/`

**Файли:**

```typescript
// Server
lib/auth.ts                  // Plugin: passkey()
lib/const.ts                 // WebAuthn config (RP_NAME, RP_ID, ORIGIN)

// Client
lib/auth-client.ts           // Plugin: passkeyClient()
lib/webauthn-client.ts       // Utilities & icons
components/passkey/passkey-setup.tsx
components/passkey/passkey-list.tsx
components/passkey/passkey-login.tsx
```

**Особливості:**

- **Platform Authenticator** - Touch ID, Face ID, Windows Hello
- **Cross-platform** - USB Security Keys, NFC
- **Sync to Cloud** - iCloud Keychain, Google Password Manager
- **Automatic Redirect** - Після успішного входу через Passkey

**Підтримка:**

- ✅ Chrome/Edge
- ✅ Safari (macOS/iOS)
- ✅ Firefox
- ✅ Mobile (iOS 16+, Android 9+)

---

### Priority 3: Account Linking

**Цель:** Связать Google OAuth с email/password аккаунтом.

**Сценарий:**

```
User registered with: john@gmail.com + password
Later wants to login with: Google (john@gmail.com)
→ System should link accounts
```

**Требуется:**

- [ ] Google OAuth setup (Better Auth)
- [ ] Account linking logic (check by email)
- [ ] UI: Show linked accounts in profile
- [ ] UI: Unlink account option

**Таблицы:**
Already exist in Better Auth:

```sql
-- table "account" already has:
provider_id: 'credential' | 'google' | 'github'
account_id: email or oauth_id
user_id: links to same user
```

**Logic:**

```typescript
// При OAuth login:
1. Check if user exists with this email
2. If yes → link account (create new account record)
3. If no → create new user + account
```

**UI:**

```
Profile → Linked Accounts:
✓ Email & Password (primary)
✓ Google (linked)
+ Add GitHub
```

---

## 🎨 UI/UX Improvements

### Planned Enhancements

#### Toast Notifications

- [ ] Success: "Email підтверджено ✓"
- [ ] Error: "Помилка входу ✗"
- [ ] Info: "Перевірте вашу пошту 📧"

**Library:** `sonner` (already installed)

#### Loading States

- [ ] Skeleton loaders for async content
- [ ] Spinner для Server Actions
- [ ] Optimistic UI updates

#### Profile Page Enhancements

- [ ] Avatar upload
- [ ] Email change (with verification)
- [ ] Account deletion (with confirmation)
- [ ] Activity log (last login, IP, etc.)

---

## 🔐 Security Enhancements

### Rate Limiting

**Critical endpoints:**

- [ ] Login: 5 attempts / 15 min
- [ ] Register: 3 attempts / hour
- [ ] Password reset: 3 attempts / hour
- [ ] 2FA code: 3 attempts / 10 min

**Library:** `@upstash/ratelimit` + Vercel KV

### Session Management

- [ ] Show active sessions in profile
- [ ] "Terminate all other sessions" button
- [ ] Session expiry notifications
- [ ] Remember device option

### Audit Log

```sql
CREATE TABLE "audit_log" (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "user"(id),
  action TEXT NOT NULL, -- 'login', 'logout', 'password_change', etc.
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 👥 Admin Panel

### User Management

- [ ] User list with filters (role, status, verified)
- [ ] User details page
- [ ] Ban/Unban user
- [ ] Force password reset
- [ ] Delete user account
- [ ] View user activity log

### Analytics Dashboard

- [ ] Total users
- [ ] New registrations (chart)
- [ ] Active sessions
- [ ] Email verification rate
- [ ] 2FA adoption rate

---

## 📱 Mobile App (Future)

### React Native

**Если потребуется mobile app:**

- [ ] Expo setup
- [ ] Shared API with web
- [ ] Biometric auth (Face ID / Touch ID)
- [ ] Push notifications

---

## 🧪 Testing

### Current State: No tests ❌

**Необходимо добавить:**

#### Unit Tests (Vitest)

- [ ] Server Actions (register, login, etc.)
- [ ] Validation schemas (Zod)
- [ ] Helper functions

#### Integration Tests (Playwright)

- [ ] Registration flow
- [ ] Login flow
- [ ] Email verification flow
- [ ] 2FA flow
- [ ] Password reset flow

#### E2E Tests (Playwright)

- [ ] Complete user journey
- [ ] Admin panel actions

---

## 📈 Performance Optimization

### Metrics to track

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s

### Optimizations

- [ ] Image optimization (WebP, next/image)
- [ ] Code splitting (dynamic imports)
- [ ] Database query optimization (indexes)
- [ ] Caching strategy (Redis?)

---

## 🌍 Internationalization (i18n)

**Current:** Ukrainian UI strings hardcoded

**Future:**

- [ ] Support multiple languages
- [ ] `next-intl` library
- [ ] Translation files (uk, en, ru)
- [ ] Language switcher in UI

---

## 📦 Technical Debt

### Known Issues

- [ ] Add proper error logging (Sentry?)
- [ ] Database migrations system (instead of manual SQL)
- [ ] Environment variables validation (t3-env)
- [ ] API documentation (for future mobile app)

---

## 🎯 Milestones

### Milestone 1: Security (2-3 weeks)

- [ ] 2FA (TOTP)
- [ ] Passkey (WebAuthn)
- [ ] Rate limiting
- [ ] Session management

### Milestone 2: Admin Panel (1-2 weeks)

- [ ] User management
- [ ] Analytics dashboard
- [ ] Audit log

### Milestone 3: Polish (1 week)

- [ ] Toast notifications
- [ ] Loading states
- [ ] Profile enhancements
- [ ] Mobile responsive improvements

### Milestone 4: Quality (2 weeks)

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance optimization

---

## 💡 Ideas for Future

### Community Features

- [ ] User profiles (public)
- [ ] Follow/Unfollow
- [ ] Activity feed

### Monetization

- [ ] Subscription plans (Stripe)
- [ ] Usage limits for free tier
- [ ] Admin-managed roles (premium users)

### Integrations

- [ ] Discord OAuth
- [ ] GitHub OAuth
- [ ] Slack notifications
- [ ] Webhook support

---

## 📚 Documentation Needs

- [x] Better Auth implementation guide
- [x] UI/UX decisions document
- [x] Roadmap (this file)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Deployment guide (Vercel/Railway)
- [ ] Contributing guide (for team)

---

## 🤝 Team & Resources

### Current Team

- Max (Developer)
- Cursor AI (AI Assistant)

### Resources Needed

- [ ] Designer (for advanced UI)
- [ ] QA Engineer (for testing)
- [ ] DevOps (for infrastructure)

---

## 📊 Priority Matrix

```
High Priority | High Impact:
- 2FA (TOTP)
- Passkey (WebAuthn)
- Rate limiting

High Priority | Medium Impact:
- Admin panel (user management)
- Session management

Medium Priority | High Impact:
- Testing suite
- Performance optimization

Low Priority | Low Impact:
- Internationalization
- Community features
```

---

## ✅ Next Actions (Start Here)

1. **~~Сделай 2FA (TOTP)~~** ✅ ЗАВЕРШЕНО (2025-11-09)
   - ✅ Install `otplib` + `qrcode`
   - ✅ Add database fields
   - ✅ Create setup flow UI
   - ✅ Test with Google Authenticator

2. **Сделай Passkey:**
   - Install `@simplewebauthn/*`
   - Add database table
   - Create registration/login flows
   - Test on multiple devices

3. **Сделай Rate Limiting:**
   - Setup Vercel KV (or Upstash)
   - Add rate limit middleware
   - Test all critical endpoints

---

**Автор:** Max + Cursor AI
**Останнє оновлення:** 10 листопада 2025
**Останнє завершено:** Passkey (WebAuthn) + 2FA (TOTP) ✅
**Наступний крок:** Rate Limiting + Admin Panel 🚀

**Документація:** `docs/@authentication/` - Повна документація автентифікації
