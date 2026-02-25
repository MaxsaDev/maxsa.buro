import type { MetadataRoute } from 'next';

// Базова URL береться з env — в продакшені обов'язково має бути встановлений.
// Без коректного NEXT_PUBLIC_APP_URL canonical URL в sitemap будуть хибними.
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Генератор sitemap.xml для Next.js App Router.
 * Доступний за адресою: /sitemap.xml
 *
 * Додавай сюди всі публічні сторінки, які мають індексуватися пошуковиками.
 * Захищені сторінки (/mx-admin, /profile, /mx-job тощо) — НЕ додавати.
 *
 * Для динамічних сторінок (наприклад /blog/[slug]) — робити окремий запит до БД
 * і додавати записи через map() всередині цієї функції.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Головна сторінка — найвищий пріоритет, оновлюється щодня
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Сторінка входу — для індексації (якщо потрібно)
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    // Сторінка реєстрації
    {
      url: `${siteUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },

    // TODO: Додати динамічні сторінки коли з'явиться публічний контент.
    // Приклад для блогу:
    // ...(await getPosts()).map((post) => ({
    //   url: `${siteUrl}/blog/${post.slug}`,
    //   lastModified: post.updatedAt,
    //   changeFrequency: 'weekly' as const,
    //   priority: 0.7,
    // })),
  ];
}
