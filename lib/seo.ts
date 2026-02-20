import type { Metadata } from 'next';

// Базова URL сайту — береться з env або fallback на localhost.
// Використовується для побудови canonical та OG URL на сторінках.
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Назва сайту — використовується як суфікс у title і в OG/Twitter.
const siteName = 'Maxsa Buro';

interface PageMetaOptions {
  // Заголовок сторінки (без суфіксу " | Maxsa Buro" — він додається через title.template в layout)
  title: string;
  // Короткий опис сторінки для <meta name="description"> та OG/Twitter
  description?: string;
  // Відносний або абсолютний canonical шлях (наприклад: '/about' або 'https://...')
  // Якщо не вказано — canonical не додається (для динамічних сторінок краще передавати явно)
  canonical?: string;
  // Заборонити індексацію цієї сторінки (наприклад: особистий кабінет, адмін)
  noIndex?: boolean;
}

/**
 * Утилітарна функція для формування метаданих сторінки.
 *
 * Використання на статичній сторінці:
 * ```ts
 * export const metadata = buildPageMeta({ title: 'Про нас', description: '...', canonical: '/about' });
 * ```
 *
 * Використання в generateMetadata:
 * ```ts
 * export async function generateMetadata({ params }): Promise<Metadata> {
 *   const post = await getPost(params.slug);
 *   return buildPageMeta({ title: post.title, description: post.excerpt, canonical: `/blog/${params.slug}` });
 * }
 * ```
 */
export function buildPageMeta({
  title,
  description,
  canonical,
  noIndex = false,
}: PageMetaOptions): Metadata {
  // Будуємо абсолютну canonical URL якщо передано відносний шлях
  const canonicalUrl = canonical
    ? canonical.startsWith('http')
      ? canonical
      : `${siteUrl}${canonical}`
    : undefined;

  return {
    title,

    ...(description && { description }),

    ...(canonicalUrl && {
      alternates: { canonical: canonicalUrl },
    }),

    // Якщо noIndex=true або сайт на localhost — забороняємо індексацію
    robots:
      noIndex || siteUrl.startsWith('http://localhost')
        ? { index: false, follow: false }
        : { index: true, follow: true },

    // OpenGraph — перевизначає глобальні значення з layout.tsx
    openGraph: {
      type: 'website',
      siteName,
      locale: 'uk_UA',
      title,
      ...(description && { description }),
      ...(canonicalUrl && { url: canonicalUrl }),
      // TODO: додати images коли буде готовий /public/og-image.png
    },

    // Twitter/X — перевизначає глобальні значення
    twitter: {
      card: 'summary',
      title,
      ...(description && { description }),
      // TODO: додати images коли буде готовий /public/og-image.png
    },
  };
}
