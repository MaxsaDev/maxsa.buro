'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Copy, Download, Eye, EyeOff, Shield } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { PasswordConfirmDialog } from '@/components/profile/password-confirm-dialog';
import { ProfileAlert } from '@/components/profile/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth/auth-client';
import { generateQRCode } from '@/lib/auth/two-factor/two-factor';

/**
 * Компонент налаштування двохфакторної автентифікації
 *
 * ✅ ОФІЦІЙНИЙ Better Auth 2FA API
 * Використовує authClient.twoFactor.* для всіх операцій
 *
 * Функціонал:
 * - Увімкнення 2FA: authClient.twoFactor.enable()
 * - Перевірка TOTP: authClient.twoFactor.verifyTotp()
 * - Вимкнення 2FA: authClient.twoFactor.disable()
 * - Регенерація кодів відновлення: authClient.twoFactor.generateBackupCodes()
 */

// ============================================================
// СХЕМИ ВАЛІДАЦІЇ
// ============================================================

const passwordSchema = z.object({
  password: z.string().min(1, { message: 'Введіть пароль' }),
});

const verifyCodeSchema = z.object({
  code: z
    .string()
    .min(6, { message: 'Код має містити 6 цифр' })
    .max(6, { message: 'Код має містити 6 цифр' })
    .regex(/^\d{6}$/, { message: 'Код має містити лише цифри' }),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;
type VerifyCodeFormValues = z.infer<typeof verifyCodeSchema>;

// ============================================================
// ПРОПСИ КОМПОНЕНТА
// ============================================================

interface TwoFactorSetupProps {
  isEnabled: boolean;
  onStatusChange?: () => void;
}

// ============================================================
// ОСНОВНИЙ КОМПОНЕНТ
// ============================================================

export const TwoFactorSetupComponent = ({ isEnabled, onStatusChange }: TwoFactorSetupProps) => {
  // ============================================================
  // СТАН
  // ============================================================

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [step, setStep] = useState<'password' | 'qr' | 'verify' | 'complete'>('password');

  // Стан показу пароля
  const [showPassword, setShowPassword] = useState(false);

  // ============================================================
  // ФОРМИ
  // ============================================================

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: 'onSubmit',
  });

  const verifyForm = useForm<VerifyCodeFormValues>({
    resolver: zodResolver(verifyCodeSchema),
    mode: 'onChange',
  });

  // ============================================================
  // КРОК 1: Увімкнення 2FA (генерація QR та кодів)
  // ============================================================

  const handleEnableTwoFactor = async (data: PasswordFormValues) => {
    setIsLoading(true);

    try {
      // Детальне логування для діагностики
      if (process.env.NODE_ENV === 'development') {
        console.log('[2FA Enable] Starting with password length:', data.password.length);
      }

      // Викликаємо офіційний Better Auth API
      const result = await authClient.twoFactor.enable({
        password: data.password,
        issuer: process.env.NEXT_PUBLIC_APP_NAME || 'Maxsa Buro',
      });

      // Детальне логування відповіді
      if (process.env.NODE_ENV === 'development') {
        console.log('[2FA Enable] Result:', {
          hasError: !!result.error,
          hasData: !!result.data,
          error: result.error,
          data: result.data ? { ...result.data, backupCodes: '[HIDDEN]' } : null,
        });
      }

      if (result.error) {
        // Логуємо тільки в dev mode
        if (process.env.NODE_ENV === 'development') {
          console.error('[2FA Enable] API Error:', result.error);
        }

        // Переклад помилок на українську
        let errorMessage = result.error.message || 'Помилка увімкнення 2FA';
        if (errorMessage.includes('Invalid password')) {
          errorMessage = 'Неправильний пароль';
        }

        toast.error(errorMessage);
        return;
      }

      if (!result.data) {
        console.error('[2FA Enable] No data in response');
        toast.error('Не вдалося отримати дані 2FA');
        return;
      }

      // Генеруємо QR код з отриманого URI
      const qrCode = await generateQRCode(result.data.totpURI);
      setQrCodeUrl(qrCode);
      setBackupCodes(result.data.backupCodes);

      // Переходимо до наступного кроку
      setStep('qr');
      toast.success('QR код згенеровано! Відскануйте його в додатку.');
    } catch (error) {
      console.error('[2FA Enable] Unexpected error:', error);
      if (error instanceof Error) {
        console.error('[2FA Enable] Error message:', error.message);
        console.error('[2FA Enable] Error stack:', error.stack);
      }
      toast.error('Помилка увімкнення 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // КРОК 2: Перевірка TOTP коду
  // ============================================================

  const handleVerifyCode = async (data: VerifyCodeFormValues) => {
    setIsLoading(true);

    try {
      // Перевіряємо TOTP код через офіційний Better Auth API
      const result = await authClient.twoFactor.verifyTotp({
        code: data.code,
        trustDevice: false,
      });

      if (result.error) {
        toast.error(result.error.message || 'Невірний код');
        return;
      }

      // Успіх! 2FA увімкнено
      toast.success('✅ Двохфакторну аутентифікацію увімкнено!');
      setStep('complete');
      setShowBackupCodes(true);

      // Оновлюємо статус в батьківському компоненті
      onStatusChange?.();
    } catch (error) {
      console.error('[2FA Verify] Error:', error);
      toast.error('Помилка верифікації коду');
    } finally {
      setIsLoading(false);
    }
  };

  // Автоматична верифікація при введенні повного коду
  const handleAutoVerify = async (code: string) => {
    if (code.length !== 6 || isLoading) return;

    setIsLoading(true);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice: false,
      });

      if (result.error) {
        toast.error(result.error.message || 'Невірний код');
        // Очищаємо поле через форму
        verifyForm.setValue('code', '');
        return;
      }

      // Успіх! 2FA увімкнено
      toast.success('✅ Двохфакторну аутентифікацію увімкнено!');
      setStep('complete');
      setShowBackupCodes(true);

      // Оновлюємо статус в батьківському компоненті
      onStatusChange?.();
    } catch (error) {
      console.error('[2FA Auto Verify] Error:', error);
      toast.error('Помилка верифікації коду');
      verifyForm.setValue('code', '');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // ВИМКНЕННЯ 2FA
  // ============================================================

  const handleDisable = async (password: string) => {
    setIsLoading(true);

    try {
      const result = await authClient.twoFactor.disable({
        password,
      });

      if (result.error) {
        let errorMessage = result.error.message || 'Помилка вимкнення 2FA';
        if (errorMessage.includes('Invalid password')) {
          errorMessage = 'Введений пароль недійсний. Спробуйте ще раз.';
        }
        toast.error(errorMessage);
        return false;
      }

      toast.success('2FA вимкнено');

      // Скидаємо стан
      setStep('password');
      setQrCodeUrl(null);
      setBackupCodes([]);
      setShowBackupCodes(false);

      onStatusChange?.();
      return true;
    } catch (error) {
      console.error('[2FA Disable] Error:', error);
      toast.error('Помилка вимкнення 2FA');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // РЕГЕНЕРАЦІЯ КОДІВ ВІДНОВЛЕННЯ
  // ============================================================

  const handleRegenerateCodes = async (password: string) => {
    setIsLoading(true);

    try {
      const result = await authClient.twoFactor.generateBackupCodes({
        password,
      });

      if (result.error) {
        let errorMessage = result.error.message || 'Помилка регенерації кодів';
        if (errorMessage.includes('Invalid password')) {
          errorMessage = 'Введений пароль недійсний. Спробуйте ще раз.';
        }
        toast.error(errorMessage);
        return false;
      }

      if (result.data?.backupCodes) {
        setBackupCodes(result.data.backupCodes);
        setShowBackupCodes(true);
        toast.success('Нові коди відновлення згенеровано');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[2FA Regenerate] Error:', error);
      toast.error('Помилка регенерації кодів');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // ДОПОМІЖНІ ФУНКЦІЇ
  // ============================================================

  const copyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Коди скопійовано');
  };

  const downloadBackupCodes = () => {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Коди завантажено');
  };

  // ============================================================
  // РЕНДЕР: 2FA вже увімкнено
  // ============================================================

  if (isEnabled) {
    return (
      <Card className="border-success/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Двохфакторна аутентифікація
          </CardTitle>
          <CardDescription>
            2FA увімкнено. Ваш акаунт захищено додатковим рівнем безпеки.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfileAlert variant="success">✓ Двохфакторна аутентифікація активна</ProfileAlert>

          <div className="flex gap-2">
            <PasswordConfirmDialog
              title="Регенерувати коди відновлення?"
              description="Це створить нові коди відновлення. Старі коди більше не працюватимуть."
              triggerLabel="Регенерувати коди"
              actionLabel="Регенерувати"
              isLoading={isLoading}
              onConfirm={handleRegenerateCodes}
            />
            <PasswordConfirmDialog
              title="Вимкнути 2FA?"
              description="Ваш акаунт буде менш захищеним. Ви впевнені?"
              triggerLabel="Вимкнути 2FA"
              actionLabel="Вимкнути"
              isLoading={isLoading}
              onConfirm={handleDisable}
              triggerVariant="destructive"
              actionClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            />
          </div>

          {showBackupCodes && backupCodes.length > 0 && (
            <div className="space-y-3">
              <ProfileAlert variant="warning" title="Коди відновлення">
                <p className="mb-3">
                  Збережіть ці коди в безпечному місці. Кожен код можна використати один раз.
                </p>
                <div className="mb-3 grid grid-cols-2 gap-2 rounded bg-white p-3 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index}>{code}</div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyBackupCodes} size="sm" variant="outline">
                    <Copy className="mr-2 size-4" />
                    Копіювати
                  </Button>
                  <Button onClick={downloadBackupCodes} size="sm" variant="outline">
                    <Download className="mr-2 size-4" />
                    Завантажити
                  </Button>
                </div>
              </ProfileAlert>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // РЕНДЕР: Процес увімкнення 2FA
  // ============================================================

  return (
    <Card className="border-warning/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-5" />
          Двохфакторна аутентифікація
        </CardTitle>
        <CardDescription>
          Додайте додатковий рівень безпеки до вашого акаунту за допомогою TOTP
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* КРОК 1: Введення пароля */}
        {step === 'password' && (
          <form
            onSubmit={passwordForm.handleSubmit(handleEnableTwoFactor)}
            className="space-y-4"
            autoComplete="off"
          >
            {/* Показати помилки валідації */}
            {Object.keys(passwordForm.formState.errors).length > 0 && (
              <ProfileAlert variant="error">
                {passwordForm.formState.errors.password?.message}
              </ProfileAlert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Ваш пароль</Label>
              <InputGroup>
                <InputGroupInput
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-1p-ignore="true"
                  data-lpignore="true"
                  aria-invalid={!!passwordForm.formState.errors.password}
                  {...passwordForm.register('password')}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                    aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Генерація...' : 'Увімкнути 2FA'}
            </Button>
          </form>
        )}

        {/* КРОК 2: Сканування QR коду */}
        {step === 'qr' && qrCodeUrl && (
          <div className="space-y-4">
            <ProfileAlert variant="info">
              Відскануйте цей QR код у вашому додатку аутентифікації (Google Authenticator, Authy,
              тощо)
            </ProfileAlert>

            <div className="flex justify-center">
              <Image src={qrCodeUrl} alt="QR Code" width={200} height={200} />
            </div>

            <Button onClick={() => setStep('verify')} size="sm">
              Далі: Ввести код
            </Button>
          </div>
        )}

        {/* КРОК 3: Перевірка TOTP коду */}
        {step === 'verify' && (
          <form onSubmit={verifyForm.handleSubmit(handleVerifyCode)} className="space-y-4">
            <ProfileAlert variant="info">
              Введіть 6-значний код з вашого додатку аутентифікації
            </ProfileAlert>

            {/* Показати помилки валідації */}
            {Object.keys(verifyForm.formState.errors).length > 0 && (
              <ProfileAlert variant="error">
                {verifyForm.formState.errors.code?.message}
              </ProfileAlert>
            )}

            <div className="flex flex-col items-center space-y-2">
              <Label htmlFor="code">Код підтвердження</Label>
              <Controller
                name="code"
                control={verifyForm.control}
                render={({ field }) => (
                  <InputOTP
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      // Автоматична відправка після введення останньої цифри
                      if (value.length === 6 && !isLoading) {
                        handleAutoVerify(value);
                      }
                    }}
                    className={verifyForm.formState.errors.code ? '[&>div]:border-destructive' : ''}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={() => setStep('qr')} size="sm" variant="outline">
                Назад
              </Button>
              <Button type="submit" size="sm" disabled={isLoading}>
                {isLoading ? 'Перевірка...' : 'Підтвердити'}
              </Button>
            </div>
          </form>
        )}

        {/* КРОК 4: Успіх + коди відновлення */}
        {step === 'complete' && (
          <div className="space-y-4">
            <ProfileAlert variant="success" title="✓ 2FA успішно увімкнено!">
              <p>Ваш акаунт тепер захищено двохфакторною аутентифікацією</p>
            </ProfileAlert>

            {backupCodes.length > 0 && (
              <ProfileAlert variant="warning" title="⚠️ Важливо: Коди відновлення">
                <p className="mb-3">
                  Збережіть ці коди в безпечному місці. Використовуйте їх якщо втратите доступ до
                  додатку аутентифікації.
                </p>
                <div className="mb-3 grid grid-cols-2 gap-2 rounded bg-white p-3 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index}>{code}</div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyBackupCodes} size="sm" variant="outline">
                    <Copy className="mr-2 size-4" />
                    Копіювати
                  </Button>
                  <Button onClick={downloadBackupCodes} size="sm" variant="outline">
                    <Download className="mr-2 size-4" />
                    Завантажити
                  </Button>
                </div>
              </ProfileAlert>
            )}

            <Button
              onClick={() => {
                setStep('password');
                setShowBackupCodes(false);
              }}
              size="sm"
            >
              Готово
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
