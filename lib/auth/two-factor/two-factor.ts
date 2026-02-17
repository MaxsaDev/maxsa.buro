/**
 * Two-Factor Authentication Helper Functions
 *
 * ✅ ОФІЦІЙНИЙ Better Auth API
 * Всі операції 2FA виконуються через authClient.twoFactor.*
 *
 * Цей файл містить ТІЛЬКИ допоміжні функції для UI
 *
 * @see https://www.better-auth.com/docs/plugins/two-factor
 */

import QRCode from 'qrcode';

/**
 * Генерація QR коду з TOTP URI для відображення в UI
 *
 * Better Auth повертає totpUri при включенні 2FA в форматі:
 * `otpauth://totp/Maxsa:user@example.com?secret=SECRET&issuer=Maxsa`
 *
 * Цей URI потрібно конвертувати в QR код для сканування в:
 * - Google Authenticator
 * - Microsoft Authenticator
 * - Authy
 * - 1Password
 * - Bitwarden
 *
 * @param totpUri - URI отриманий з authClient.twoFactor.enable()
 * @returns Data URL для відображення QR коду в <img>
 *
 * @example
 * ```typescript
 * const { data } = await authClient.twoFactor.enable({ password });
 * if (data?.totpUri) {
 *   const qrCode = await generateQRCode(data.totpUri);
 *   // <img src={qrCode} alt="QR Code" />
 * }
 * ```
 *
 * @throws Error якщо генерація QR коду невдала
 */
export const generateQRCode = async (totpUri: string): Promise<string> => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(totpUri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('[2FA] QR Code generation failed:', error);
    throw new Error('Не вдалося згенерувати QR код');
  }
};

/**
 * BETTER AUTH 2FA FLOW
 * =====================
 *
 * 1. Enable 2FA:
 *    const result = await authClient.twoFactor.enable({ password });
 *    - Отримуємо: totpUri, backupCodes
 *
 * 2. Генеруємо QR код:
 *    const qrCode = await generateQRCode(result.data.totpUri);
 *
 * 3. Користувач сканує QR код в authenticator app
 *
 * 4. Verify TOTP:
 *    await authClient.twoFactor.verifyTotp({ code: '123456' });
 *
 * 5. Login з 2FA:
 *    - Спочатку email/password
 *    - Якщо 2FA enabled → запит TOTP коду
 *    - await authClient.twoFactor.verifyTotp({ code })
 *    - АБО await authClient.twoFactor.verifyBackupCode({ code })
 *
 * 6. Disable 2FA:
 *    await authClient.twoFactor.disable({ password });
 *
 * 7. Regenerate Backup Codes:
 *    await authClient.twoFactor.generateBackupCodes({ password });
 */
