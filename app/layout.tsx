import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/toaster';
import './globals.css';
import './theme-overrides.css';

// Базова URL сайту — береться з env або fallback на localhost для розробки.
// В продакшені NEXT_PUBLIC_APP_URL обов'язково має бути встановлений (наприклад: https://example.com).
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  fallback: ['monospace'],
});

// Viewport винесений окремо — так вимагає Next.js 16 (не можна разом з metadata).
// themeColor тут задає колір рядка браузера на мобільних пристроях.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
};

// Глобальні метадані — успадковуються всіма сторінками.
// Сторінки можуть перевизначати title, description, openGraph тощо.
export const metadata: Metadata = {
  // metadataBase — базова URL для відносних шляхів у метаданих (canonical, OG images тощо).
  // Без цього Next.js не зможе побудувати абсолютні URL для og:url, canonical і т.д.
  metadataBase: new URL(siteUrl),

  // title.template застосовується до всіх дочірніх сторінок: "Назва сторінки | Maxsa Buro"
  // title.default — fallback якщо сторінка не задає свій title
  title: {
    template: '%s | Maxsa Buro',
    default: 'Maxsa Buro',
  },

  description: 'Maxsa Buro — система керування бізнесом.',

  applicationName: 'Maxsa Buro',

  // Canonical та мовні альтернативи — базовий canonical на головну.
  // Сторінки повинні перевизначати alternates.canonical через generateMetadata або metadata.
  alternates: {
    canonical: '/',
  },

  // robots — дозволяємо індексацію тільки в продакшені.
  // Якщо NEXT_PUBLIC_APP_URL не встановлений або вказує на localhost — забороняємо індексацію.
  robots: siteUrl.startsWith('http://localhost')
    ? { index: false, follow: false }
    : { index: true, follow: true, googleBot: { index: true, follow: true } },

  // OpenGraph — базові глобальні значення.
  // TODO: додати og:image коли буде готовий файл /public/og-image.png (розмір 1200×630)
  openGraph: {
    type: 'website',
    siteName: 'Maxsa Buro',
    locale: 'uk_UA',
    url: siteUrl,
    title: 'Maxsa Buro',
    description: 'Maxsa Buro — система керування бізнесом.',
    // images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Maxsa Buro' }],
  },

  // Twitter/X card — summary без великого зображення (поки немає og:image).
  // Змінити на 'summary_large_image' коли буде готове зображення.
  twitter: {
    card: 'summary',
    title: 'Maxsa Buro',
    description: 'Maxsa Buro — система керування бізнесом.',
    // images: ['/og-image.png'],
  },

  // Іконки — підключаємо всі варіанти фавікон з /public/favicon/.
  // Next.js перетворює ці шляхи у відповідні <link> теги в <head>.
  icons: {
    // Стандартний favicon для браузерів (ICO формат — найширша сумісність)
    icon: [
      { url: '/favicon/favicon.ico', sizes: 'any' },
      { url: '/favicon/icon0.svg', type: 'image/svg+xml' },
      { url: '/favicon/icon1.png', type: 'image/png' },
    ],
    // Apple Touch Icon — для iOS "Add to Home Screen"
    apple: [{ url: '/favicon/apple-icon.png' }],
  },

  // Web App Manifest — для PWA (Android Chrome, Edge тощо).
  // Шлях до manifest.json в /public/favicon/
  manifest: '/favicon/manifest.json',

  // formatDetection — вимикаємо автоматичне перетворення телефонів/адрес у посилання на iOS.
  // Це запобігає небажаній зміні UI мобільним Safari.
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
