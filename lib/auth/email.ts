import { Resend } from 'resend';

// Ініціалізація Resend клієнта
const resend = new Resend(process.env.RESEND_API_KEY);

// Адреса відправника (потрібно верифікувати в Resend)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Відправка email через Resend
 */
export const sendEmail = async ({ to, subject, html }: SendEmailOptions) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email Service] Помилка відправки:', error);
      throw new Error(`Не вдалося відправити email: ${error.message}`);
    }

    console.log('[Email Service] Email успішно відправлено:', { to, subject, id: data?.id });
    return data;
  } catch (error) {
    console.error('[Email Service] Критична помилка:', error);
    throw error;
  }
};

// ─── Спільні стилі та компоненти ────────────────────────────────────────────

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="40" height="40" style="display:block;">
  <circle cx="500" cy="500" r="500" fill="#231f20"/>
  <path d="M425.3,811.85c-180.9-27.9-250.2-162.9-250.2-297,0-160.2,109.8-326.7,324.9-326.7s324.9,159.3,324.9,324.9c0,130.5-73.8,270-238.5,294.3v-155.7c54-21.6,88.2-74.7,88.2-144s-37.8-126-102.6-146.7v209.7h-135.9v-210.6c-70.2,20.7-110.7,73.8-110.7,147.6,0,67.5,33.3,125.1,99.9,146.7v157.5Z" fill="#fff"/>
</svg>`;

const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background-color: #f5f4f0;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    color: #1a1a1a;
  }

  .email-wrapper {
    background-color: #f5f4f0;
    padding: 48px 20px;
    min-height: 100vh;
  }

  .email-card {
    max-width: 580px;
    margin: 0 auto;
    background-color: #ffffff;
    border: 1px solid #e0ddd6;
  }

  /* ── Хедер ── */
  .email-header {
    background-color: #1a1a1a;
    padding: 32px 48px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .email-header-wordmark {
    color: #ffffff;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    line-height: 1;
  }

  .email-header-sub {
    color: #888;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-top: 4px;
  }

  /* ── Золота розділова лінія ── */
  .gold-rule {
    height: 2px;
    background: linear-gradient(90deg, #c9a84c 0%, #e8cc7a 50%, #c9a84c 100%);
  }

  /* ── Основний контент ── */
  .email-body {
    padding: 48px 48px 40px;
  }

  .email-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #c9a84c;
    margin-bottom: 16px;
  }

  .email-title {
    font-family: Georgia, 'Times New Roman', Times, serif;
    font-size: 26px;
    font-weight: 400;
    color: #1a1a1a;
    line-height: 1.25;
    margin-bottom: 20px;
    letter-spacing: -0.01em;
  }

  .email-divider {
    width: 40px;
    height: 1px;
    background-color: #c9a84c;
    margin-bottom: 24px;
  }

  .email-text {
    font-size: 15px;
    line-height: 1.7;
    color: #444;
    margin-bottom: 16px;
  }

  /* ── Кнопка ── */
  .email-button-wrap {
    margin: 32px 0;
  }

  .email-button {
    display: inline-block;
    padding: 14px 32px;
    background-color: #1a1a1a;
    color: #ffffff !important;
    text-decoration: none;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    transition: background-color 0.2s;
  }

  .email-button:hover {
    background-color: #333;
  }

  /* ── URL fallback ── */
  .email-url-section {
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px solid #e8e5df;
  }

  .email-url-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 8px;
  }

  .email-url-text {
    font-size: 12px;
    color: #c9a84c;
    word-break: break-all;
    line-height: 1.6;
    font-family: 'Courier New', Courier, monospace;
  }

  .email-url-text a {
    color: #c9a84c;
    text-decoration: none;
  }

  /* ── Notice / попередження ── */
  .email-notice {
    margin-top: 28px;
    padding: 18px 20px;
    border-left: 3px solid #c9a84c;
    background-color: #faf9f5;
  }

  .email-notice-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #1a1a1a;
    margin-bottom: 6px;
  }

  .email-notice-text {
    font-size: 13px;
    line-height: 1.6;
    color: #666;
  }

  /* ── Підвал ── */
  .email-footer {
    background-color: #f5f4f0;
    border-top: 1px solid #e0ddd6;
    padding: 24px 48px;
  }

  .email-footer-text {
    font-size: 11px;
    color: #aaa;
    line-height: 1.7;
    letter-spacing: 0.02em;
  }

  .email-footer-text + .email-footer-text {
    margin-top: 4px;
  }

  .email-footer-brand {
    margin-top: 16px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #c9a84c;
  }
`;

/**
 * Базова HTML-обгортка для всіх листів
 */
const buildEmailHtml = (subject: string, content: string): string => `<!DOCTYPE html>
<html lang="uk" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-card">

      <!-- Хедер -->
      <div class="email-header">
        ${LOGO_SVG}
        <div>
          <div class="email-header-wordmark">Maxsa Buro</div>
          <div class="email-header-sub">Система керування бізнесом</div>
        </div>
      </div>

      <!-- Золота лінія -->
      <div class="gold-rule"></div>

      <!-- Контент -->
      ${content}

      <!-- Підвал -->
      <div class="email-footer">
        <div class="email-footer-text">Це автоматичне повідомлення від системи Maxsa Buro.</div>
        <div class="email-footer-text">Будь ласка, не відповідайте на цей лист.</div>
        <div class="email-footer-brand">© Maxsa Buro</div>
      </div>

    </div>
  </div>
</body>
</html>`;

// ─── Email-шаблони ───────────────────────────────────────────────────────────

/**
 * Email для верифікації адреси
 */
export const sendVerificationEmail = async (email: string, url: string) => {
  const subject = 'Підтвердіть вашу електронну адресу';

  const content = `
    <div class="email-body">
      <div class="email-label">Підтвердження акаунту</div>
      <h1 class="email-title">Підтвердіть вашу електронну адресу</h1>
      <div class="email-divider"></div>

      <p class="email-text">
        Дякуємо за реєстрацію в Maxsa Buro. Для завершення налаштування
        акаунту підтвердіть, будь ласка, вашу електронну адресу.
      </p>

      <div class="email-button-wrap">
        <a href="${url}" class="email-button">Підтвердити адресу</a>
      </div>

      <div class="email-url-section">
        <div class="email-url-label">Або відкрийте посилання вручну</div>
        <div class="email-url-text"><a href="${url}">${url}</a></div>
      </div>

      <div class="email-notice">
        <div class="email-notice-title">Важлива інформація</div>
        <div class="email-notice-text">
          Посилання дійсне протягом 24 годин. Якщо ви не реєструвалися
          в системі — просто проігноруйте цей лист.
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html: buildEmailHtml(subject, content) });
};

/**
 * Email для скидання паролю
 */
export const sendPasswordResetEmail = async (email: string, url: string) => {
  const subject = 'Скидання паролю — Maxsa Buro';

  const content = `
    <div class="email-body">
      <div class="email-label">Безпека акаунту</div>
      <h1 class="email-title">Запит на скидання паролю</h1>
      <div class="email-divider"></div>

      <p class="email-text">
        Ми отримали запит на скидання паролю для вашого акаунту в Maxsa Buro.
        Натисніть кнопку нижче, щоб встановити новий пароль.
      </p>

      <div class="email-button-wrap">
        <a href="${url}" class="email-button">Встановити новий пароль</a>
      </div>

      <div class="email-url-section">
        <div class="email-url-label">Або відкрийте посилання вручну</div>
        <div class="email-url-text"><a href="${url}">${url}</a></div>
      </div>

      <div class="email-notice">
        <div class="email-notice-title">Увага — безпека</div>
        <div class="email-notice-text">
          Посилання дійсне протягом 1 години та може бути використане лише один раз.
          Якщо ви не надсилали цей запит — ваш пароль залишається незмінним,
          жодних дій не потрібно.
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html: buildEmailHtml(subject, content) });
};
