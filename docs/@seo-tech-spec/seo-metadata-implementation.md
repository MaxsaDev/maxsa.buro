# SEO & Metadata Implementation — Технічний специфікація

## 1. Опис задачі

### Проблема

Next.js App Router проект не мав жодної SEO-інфраструктури:

- `app/layout.tsx` містив лише порожній `metadata` з `title` і `description`
- Відсутні `robots.txt`, `sitemap.xml`
- Фавікони існували у `/public/favicon/`, але не були підключені
- `manifest.json` мав хибні шляхи до іконок (без `/favicon/` префіксу)
- Не існувало механізму для перевизначення метаданих на рівні сторінок

### Рішення

Повна SEO-інфраструктура через офіційний **Next.js Metadata API** без сторонніх бібліотек:

- Глобальні метадані в `app/layout.tsx` (успадковуються всіма сторінками)
- Утилітарний helper `lib/seo.ts` для сторінкових метаданих
- Генератори `app/sitemap.ts` і `app/robots.ts`
- Виправлений `public/favicon/manifest.json`

---

## 2. Стек і технології

| Технологія     | Версія          | Роль у задачі                                                                           |
| -------------- | --------------- | --------------------------------------------------------------------------------------- |
| **Next.js**    | 16 (App Router) | Metadata API: `export const metadata`, `generateMetadata`, `MetadataRoute`              |
| **TypeScript** | 5 (strict)      | Типізація через `Metadata`, `Viewport`, `MetadataRoute.Sitemap`, `MetadataRoute.Robots` |
| **env змінні** | —               | `NEXT_PUBLIC_APP_URL` — єдине джерело базової URL                                       |

**Чому не сторонні бібліотеки (next-seo тощо):**
Next.js 16 Metadata API повністю покриває всі потреби: `<title>`, `<meta>`, canonical, OG, Twitter, icons, manifest, robots, sitemap. Додаткові залежності лише збільшують bundle і дублюють вбудований функціонал.

---

## 3. Архітектура і патерни

### 3.1 Ієрархія метаданих Next.js

```
app/layout.tsx          ← глобальний базис (metadataBase, title.template, icons, manifest)
  ↓ успадкування
app/page.tsx            ← перевизначає title, description, canonical
app/(auth)/login/page.tsx
app/(protected)/profile/page.tsx   ← noIndex: true
app/blog/[slug]/page.tsx           ← generateMetadata() для динамічних даних
```

**Правило злиття:** Next.js **глибоко мержить** об'єкти metadata. Якщо сторінка задає `openGraph.title`, решта OG-полів залишається від layout. Виняток: `icons` і `manifest` — повністю перевизначаються якщо задані на сторінці.

### 3.2 title.template патерн

```
layout: title.template = '%s | Maxsa Buro'
         title.default  = 'Maxsa Buro'

page:    title = 'Профіль'
result:  <title>Профіль | Maxsa Buro</title>

page:    title не задано
result:  <title>Maxsa Buro</title>   ← використовується default
```

### 3.3 Env-залежна логіка robots/noindex

Єдина умова керує індексацією на всіх рівнях:

```
NEXT_PUBLIC_APP_URL = 'http://localhost:3000'  →  noindex, nofollow (скрізь)
NEXT_PUBLIC_APP_URL = 'https://example.com'    →  index, follow (публічні сторінки)
                                                   noindex для noIndex: true сторінок
```

### 3.4 Viewport винесений окремо

Next.js 16 **забороняє** `viewport` і `themeColor` в об'єкті `metadata` — вони повинні бути окремим `export const viewport: Viewport`. Порушення цього правила генерує попередження і ігнорується рантаймом.

### 3.5 metadataBase — обов'язковий для абсолютних URL

Без `metadataBase` Next.js не може побудувати абсолютні URL для:

- `og:url`
- `canonical` (якщо переданий відносний шлях `/about`)
- `og:image` (якщо переданий відносний шлях `/og-image.png`)

В dev-режимі Next.js показує warning і використовує `http://localhost:PORT` як fallback.

---

## 4. Файли реалізації

### 4.1 `app/layout.tsx` — глобальний SEO базис

**Роль:** Кореневий layout, метадані якого успадковуються всіма сторінками. Єдине місце підключення фавіконів і manifest.

**Ключові експорти:**

```ts
export const viewport: Viewport = { ... }   // themeColor, width, initialScale
export const metadata: Metadata = { ... }   // все інше
```

**Повний зміст `metadata`:**

```ts
{
  metadataBase: new URL(siteUrl),           // базова URL для відносних шляхів

  title: {
    template: '%s | Maxsa Buro',            // шаблон для сторінок
    default: 'Maxsa Buro',                  // fallback якщо сторінка не задає title
  },

  description: 'Maxsa Buro — ...',
  applicationName: 'Maxsa Buro',

  alternates: { canonical: '/' },          // canonical для головної сторінки

  robots: siteUrl.startsWith('http://localhost')
    ? { index: false, follow: false }
    : { index: true, follow: true, googleBot: { index: true, follow: true } },

  openGraph: {
    type: 'website',
    siteName: 'Maxsa Buro',
    locale: 'uk_UA',
    url: siteUrl,
    title: 'Maxsa Buro',
    description: '...',
    // images: TODO — /public/og-image.png (1200×630)
  },

  twitter: {
    card: 'summary',                        // → 'summary_large_image' після додавання og:image
    title: 'Maxsa Buro',
    description: '...',
  },

  icons: {
    icon: [
      { url: '/favicon/favicon.ico', sizes: 'any' },   // IE/старі браузери
      { url: '/favicon/icon0.svg', type: 'image/svg+xml' }, // сучасні браузери
      { url: '/favicon/icon1.png', type: 'image/png' },
    ],
    apple: [{ url: '/favicon/apple-icon.png' }],       // iOS home screen
  },

  manifest: '/favicon/manifest.json',      // PWA manifest

  formatDetection: {
    telephone: false,   // вимикає автолінки телефонів на iOS Safari
    address: false,
    email: false,
  },
}
```

**Viewport:**

```ts
{
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
}
```

**HTML теги які Next.js генерує з цих метаданих:**

```html
<link rel="icon" href="/favicon/favicon.ico" sizes="any" />
<link rel="icon" href="/favicon/icon0.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon/icon1.png" type="image/png" />
<link rel="apple-touch-icon" href="/favicon/apple-icon.png" />
<link rel="manifest" href="/favicon/manifest.json" />
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#09090b" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://example.com/" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Maxsa Buro" />
<meta property="og:locale" content="uk_UA" />
<meta name="twitter:card" content="summary" />
<meta name="format-detection" content="telephone=no, address=no, email=no" />
```

---

### 4.2 `lib/seo.ts` — helper для сторінкових метаданих

**Роль:** Утилітарна функція, яка формує об'єкт `Metadata` для окремих сторінок. Усуває дублювання: розробник передає лише `title`, `description`, `canonical`, `noIndex` — helper будує повний об'єкт із OG і Twitter.

**Інтерфейс:**

```ts
interface PageMetaOptions {
  title: string; // обов'язковий — назва сторінки (без суфіксу)
  description?: string; // опціональний — meta description і OG description
  canonical?: string; // '/about' або 'https://...' — обидва формати підтримуються
  noIndex?: boolean; // default: false — true для закритих сторінок
}
```

**Алгоритм `buildPageMeta`:**

```
1. canonicalUrl = якщо canonical передано:
     якщо починається з 'http' → використати as-is
     інакше → `${siteUrl}${canonical}`
   інакше → undefined (canonical не додається)

2. robots = якщо noIndex=true АБО siteUrl містить 'localhost':
     { index: false, follow: false }
   інакше:
     { index: true, follow: true }

3. Повернути об'єкт Metadata:
   - title (рядок — Next.js застосує title.template з layout)
   - description (тільки якщо передано — умовний spread)
   - alternates.canonical (тільки якщо canonicalUrl визначено)
   - robots
   - openGraph: { type, siteName, locale, title, description?, url? }
   - twitter: { card, title, description? }
```

**Використання:**

```ts
// Статична сторінка
import { buildPageMeta } from '@/lib/seo';

export const metadata = buildPageMeta({
  title: 'Про нас',
  description: 'Коротко про компанію',
  canonical: '/about',
});

// Захищена сторінка (без індексації)
export const metadata = buildPageMeta({
  title: 'Профіль',
  noIndex: true,
});

// Динамічна сторінка
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Не знайдено' };

  return buildPageMeta({
    title: post.title,
    description: post.excerpt,
    canonical: `/blog/${params.slug}`,
  });
}
```

---

### 4.3 `app/sitemap.ts` — генератор `/sitemap.xml`

**Роль:** Server-side генерація XML-sitemap. Next.js автоматично обробляє цей файл і повертає правильний `Content-Type: application/xml`.

**Тип повернення:** `MetadataRoute.Sitemap` — масив об'єктів:

```ts
interface SitemapEntry {
  url: string; // абсолютна URL
  lastModified?: Date | string; // для Cache-Control і пошукових систем
  changeFrequency?: // підказка пошуковику про частоту змін
    'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number; // 0.0–1.0, default 0.5
}
```

**Поточні записи та їх пріоритети:**

| URL         | changeFrequency | priority | Обґрунтування                     |
| ----------- | --------------- | -------- | --------------------------------- |
| `/`         | `daily`         | `1.0`    | Головна — найважливіша            |
| `/login`    | `monthly`       | `0.3`    | Рідко змінюється, низька цінність |
| `/register` | `monthly`       | `0.3`    | Аналогічно                        |

**Розширення для динамічних сторінок:**

```ts
// Зробити функцію async
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await db.query('SELECT slug, updated_at FROM posts WHERE published = true');

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    ...posts.rows.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
```

---

### 4.4 `app/robots.ts` — генератор `/robots.txt`

**Роль:** Серверний генератор `robots.txt`. Логіка залежить від середовища.

**Алгоритм:**

```
якщо siteUrl містить 'localhost':
  → повна заборона: Disallow: /
  (захищає dev-оточення від випадкової індексації)

інакше:
  → Allow: /
  → Disallow: /mx-admin/, /mx-job/, /profile/, /onboarding/, /api/
  → Sitemap: ${siteUrl}/sitemap.xml
```

**Результат у продакшені (`/robots.txt`):**

```
User-agent: *
Allow: /
Disallow: /mx-admin/
Disallow: /mx-job/
Disallow: /profile/
Disallow: /onboarding/
Disallow: /api/

Sitemap: https://example.com/sitemap.xml
```

**Результат у розробці:**

```
User-agent: *
Disallow: /
```

---

### 4.5 `public/favicon/manifest.json` — Web App Manifest

**Роль:** PWA маніфест для Android Chrome, Edge та інших браузерів що підтримують "Add to Home Screen".

**Критична помилка що була виправлена:** оригінальні шляхи іконок були відносними від кореня (`/web-app-manifest-192x192.png`), але файли фізично знаходяться в `/public/favicon/` → URL мають бути `/favicon/web-app-manifest-192x192.png`.

**Фінальна структура:**

```json
{
  "name": "Maxsa Buro",
  "short_name": "Maxsa Buro",
  "icons": [
    {
      "src": "/favicon/web-app-manifest-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/favicon/web-app-manifest-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

**`purpose: "maskable"`** — іконки адаптовані для масочного відображення на Android (безпечна зона — центральні 80% іконки).

---

## 5. Структура файлів фавіконів

```
/public/favicon/
  favicon.ico                    # ICO — IE та старі браузери, <link sizes="any">
  icon0.svg                      # SVG — сучасні браузери (Chrome 93+, Firefox 86+)
  icon1.png                      # PNG — fallback для браузерів без SVG
  apple-icon.png                 # 180×180 PNG — iOS Safari "Add to Home Screen"
  web-app-manifest-192x192.png   # Android Chrome PWA icon
  web-app-manifest-512x512.png   # Android Chrome PWA icon (великий)
  manifest.json                  # Web App Manifest
```

**Пріоритет браузерів при виборі іконки:**

```
SVG підтримується → icon0.svg
інакше            → icon1.png (PNG)
Safari/iOS        → apple-icon.png (через <link rel="apple-touch-icon">)
PWA install       → manifest.json → web-app-manifest-*.png
```

---

## 6. Змінні середовища

| Змінна                | Обов'язкова  | Призначення                                                                |
| --------------------- | ------------ | -------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | В продакшені | Базова URL сайту. Використовується в layout, seo.ts, sitemap.ts, robots.ts |

**`.env.local` (розробка):**

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Продакшн (Vercel / сервер):**

```
NEXT_PUBLIC_APP_URL=https://maxsa.buro.ua
```

**Поведінка при різних значеннях:**

```
http://localhost:*  → robots: noindex | robots.txt: Disallow: / | canonical: localhost URLs
https://*           → robots: index   | robots.txt: Allow + Disallow список | canonical: prod URLs
```

---

## 7. Пошаговая інтеграція в новий проект

### Крок 1: Підготовка фавіконів

1. Згенеруй пакет на [realfavicongenerator.net](https://realfavicongenerator.net)
2. Розпакуй в `/public/favicon/`
3. Переконайся що є файли: `favicon.ico`, `icon0.svg` або `icon1.png`, `apple-icon.png`, `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`, `manifest.json`
4. **Обов'язково виправ** шляхи в `manifest.json` — вони мають бути `/favicon/...`, а не `/...`

### Крок 2: Env змінна

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Крок 3: `app/layout.tsx`

Замінити мінімальний `metadata` на повний (див. розділ 4.1). Ключові моменти:

- Винести `viewport` окремо (Next.js 16 вимога)
- Встановити `metadataBase: new URL(siteUrl)`
- Прописати `title.template` і `title.default`
- Підключити всі іконки через `icons` і `manifest`

### Крок 4: `lib/seo.ts`

Скопіювати утиліту `buildPageMeta` (розділ 4.2). Оновити:

- `siteName` — назва проекту
- Locale якщо відрізняється від `uk_UA`

### Крок 5: `app/robots.ts`

Скопіювати і оновити список `disallow` відповідно до захищених маршрутів проекту.

### Крок 6: `app/sitemap.ts`

Скопіювати і додати всі публічні маршрути. Для динамічних — зробити функцію `async`.

### Крок 7: Сторінки

На кожній публічній сторінці додати:

```ts
import { buildPageMeta } from '@/lib/seo';
export const metadata = buildPageMeta({ title: '...', description: '...', canonical: '/path' });
```

На захищених сторінках (dashboard, admin, profile):

```ts
export const metadata = buildPageMeta({ title: 'Профіль', noIndex: true });
```

---

## 8. Типові помилки і пастки

### ❌ `viewport` в `metadata`

```ts
// НЕПРАВИЛЬНО — ігнорується Next.js 16, генерує warning
export const metadata: Metadata = {
  viewport: 'width=device-width',
  themeColor: '#ffffff',
  // ...
};

// ПРАВИЛЬНО
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};
```

### ❌ Відносні шляхи без `metadataBase`

```ts
// НЕПРАВИЛЬНО — og:url буде відносним
openGraph: {
  url: '/about';
}

// ПРАВИЛЬНО — metadataBase в layout автоматично побудує абсолютну URL
openGraph: {
  url: '/about';
} // з metadataBase: new URL('https://example.com') → https://example.com/about
```

### ❌ Хибні шляхи в manifest.json

```json
// НЕПРАВИЛЬНО — файл в /public/favicon/, а шлях без префіксу
{ "src": "/web-app-manifest-192x192.png" }

// ПРАВИЛЬНО
{ "src": "/favicon/web-app-manifest-192x192.png" }
```

### ❌ `canonical` без `metadataBase` при відносному шляху

`buildPageMeta` будує canonical через `${siteUrl}${canonical}`. Якщо `NEXT_PUBLIC_APP_URL` не встановлений — canonical буде `http://localhost:3000/about`. Це не критично в розробці, але **обов'язково** встановити перед деплоєм.

### ❌ Захищені сторінки без `noIndex`

Без явного `noIndex: true` захищені сторінки (profile, admin) можуть бути проіндексовані якщо Google їх знайде (через посилання). Robots.txt закриває директорії, але `noIndex` на рівні HTTP-заголовка — надійніший метод.

### ❌ `sitemap.ts` з синхронним кодом для динамічних даних

```ts
// НЕПРАВИЛЬНО — не можна звертатись до БД в синхронній функції
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = db.query(...); // ← помилка
}

// ПРАВИЛЬНО
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await db.query(...);
}
```

---

## 9. Чеклист перевірки після інтеграції

```bash
# 1. Перевірка HTML <head>
# Відкрий сторінку → View Source → шукай в <head>:
# <title>, <meta name="description">, <link rel="canonical">,
# <link rel="icon">, <link rel="apple-touch-icon">, <link rel="manifest">,
# <meta property="og:*">, <meta name="twitter:*">

# 2. robots.txt
curl http://localhost:3000/robots.txt
# Очікується: User-agent: * / Disallow: /  (в dev)

# 3. sitemap.xml
curl http://localhost:3000/sitemap.xml
# Очікується: валідний XML з <urlset>

# 4. manifest.json
curl http://localhost:3000/favicon/manifest.json
# Очікується: JSON з icons[] де src = /favicon/web-app-manifest-*.png

# 5. Favicon у вкладці браузера — просто відкрий localhost:3000

# 6. iOS: Safari → Поділитися → "На головний екран"
# Очікується: іконка apple-icon.png, назва "Maxsa Buro"

# 7. Продакшн — Google Rich Results Test або просто View Source
# Перевір що og:url і canonical містять реальний домен, а не localhost
```

---

## 10. TODO / Розширення

| Задача                         | Пріоритет                        | Деталі                                                                                         |
| ------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| OG Image                       | Середній                         | Створити `/public/og-image.png` (1200×630), розкоментувати `images` в layout і `buildPageMeta` |
| twitter: `summary_large_image` | Після OG Image                   | Змінити `card: 'summary'` → `'summary_large_image'` в layout і `lib/seo.ts`                    |
| Динамічний sitemap             | Коли з'явиться публічний контент | Зробити `sitemap()` async, додати запити до БД                                                 |
| `lang` альтернативи            | Якщо буде мультимова             | Додати `alternates.languages` в `buildPageMeta`                                                |
| Structured Data (JSON-LD)      | SEO+                             | Додати `<script type="application/ld+json">` через `next/script` в layout або сторінках        |
