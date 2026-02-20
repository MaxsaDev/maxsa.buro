import type { MetadataRoute } from 'next';

// Базова URL для посилання на sitemap в robots.txt.
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Генератор robots.txt для Next.js App Router.
 * Доступний за адресою: /robots.txt
 *
 * Логіка:
 * - В продакшені (NEXT_PUBLIC_APP_URL не localhost) — дозволяємо індексацію публічних сторінок,
 *   але забороняємо індексацію захищених розділів (/mx-admin, /profile, /mx-job, /api тощо).
 * - В розробці (localhost) — повністю забороняємо індексацію (Disallow: /).
 */
export default function robots(): MetadataRoute.Robots {
  // В розробці — повна заборона індексації
  if (siteUrl.startsWith('http://localhost')) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    };
  }

  // В продакшені — тонке налаштування
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Захищені розділи — не повинні індексуватися
          '/mx-admin/',
          '/mx-job/',
          '/profile/',
          '/onboarding/',
          // API маршрути
          '/api/',
        ],
      },
    ],
    // Посилання на sitemap — пошукові системи підхоплять його автоматично
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
