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

/**
 * Email для верифікації адреси
 */
export const sendVerificationEmail = async (email: string, url: string) => {
  const subject = 'Підтвердіть вашу електронну адресу';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { color: #666; font-size: 12px; margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Підтвердіть вашу електронну адресу</h1>
          <p>Дякуємо за реєстрацію! Натисніть кнопку нижче, щоб підтвердити вашу електронну адресу:</p>
          <a href="${url}" class="button">Підтвердити email</a>
          <p>Або скопіюйте це посилання у ваш браузер:</p>
          <p style="word-break: break-all; color: #666;">${url}</p>
          <div class="footer">
            <p>Якщо ви не реєструвалися на нашому сайті, просто проігноруйте цей лист.</p>
            <p>Це посилання діє протягом 24 годин.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

/**
 * Email для скидання паролю
 */
export const sendPasswordResetEmail = async (email: string, url: string) => {
  const subject = 'Скидання паролю';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .warning { background-color: #fef3cd; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Скидання паролю</h1>
          <p>Ви запросили скидання паролю. Натисніть кнопку нижче, щоб встановити новий пароль:</p>
          <a href="${url}" class="button">Скинути пароль</a>
          <p>Або скопіюйте це посилання у ваш браузер:</p>
          <p style="word-break: break-all; color: #666;">${url}</p>
          <div class="warning">
            <strong>⚠️ Важливо:</strong> Якщо ви не запитували скидання паролю, проігноруйте цей лист.
            Ваш пароль залишиться незмінним.
          </div>
          <div class="footer">
            <p>Це посилання діє протягом 1 години.</p>
            <p>З міркувань безпеки, посилання можна використати тільки один раз.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};
