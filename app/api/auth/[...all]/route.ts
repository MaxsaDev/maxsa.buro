import { toNextJsHandler } from 'better-auth/next-js';

import { auth } from '@/lib/auth/auth';

// Вимикаємо статичну генерацію для auth API
export const dynamic = 'force-dynamic';

// Better Auth автоматично обробляє всі auth endpoints:
// POST /api/auth/sign-up/email - реєстрація
// POST /api/auth/sign-in/email - логін
// POST /api/auth/sign-out - вихід
// POST /api/auth/sign-in/social - OAuth (Google)
// POST /api/auth/reset-password - скидання паролю
// POST /api/auth/verify-email - верифікація email
// GET  /api/auth/session - отримання сесії
// та багато інших...

export const { GET, POST } = toNextJsHandler(auth);
