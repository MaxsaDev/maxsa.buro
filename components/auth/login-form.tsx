'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Eye, EyeOff, MailIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ComponentPropsWithoutRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { loginAction } from '@/actions/auth/login';
import { resendVerificationAction } from '@/actions/auth/resend-verification';
import { PasskeyLogin } from '@/components/passkey/passkey-login';
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
import { cn } from '@/lib/utils';
import { loginSchema, type LoginFormValues } from '@/schemas/auth/schema-auth';

export function LoginForm({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Стан показу пароля
  const [showPassword, setShowPassword] = useState(false);

  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    setUnverifiedEmail(null);

    try {
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);

      const result = await loginAction(null, formData);

      // Якщо потрібен 2FA
      if (result.requiresTwoFactor) {
        setShow2FA(true);
        setTwoFactorEmail(result.email || data.email);
        toast.info(result.message || 'Введіть код з додатку аутентифікації');
        setIsSubmitting(false);
        return;
      }

      if (!result.success) {
        if (result.errors) {
          if (result.errors.email) {
            setError('email', { message: result.errors.email[0] });
          }
          if (result.errors.password) {
            setError('password', { message: result.errors.password[0] });
          }
        }

        setServerError(result.message || 'Помилка входу');

        // Перевіряємо чи це помилка неверифікованого email
        if (
          result.message?.includes('не підтверджено') ||
          result.message?.includes('not verified')
        ) {
          setUnverifiedEmail(data.email);
          toast.error(result.message || 'Помилка входу', {
            description: 'Натисніть кнопку нижче для повторної відправки листа',
          });
        } else {
          toast.error(result.message || 'Помилка входу');
        }
      }
      // Якщо success - відбудеться redirect в Server Action
    } catch (error) {
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        return;
      }

      console.error('[Login Form] Помилка:', error);
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Верифікація 2FA коду
  const handleVerify2FA = async (codeOverride?: string) => {
    // Перевірка TOTP коду
    if (!useBackupCode) {
      const code = codeOverride ?? totpCode;

      if (code.length !== 6) {
        toast.error('Введіть 6-значний код');
        return;
      }

      setIsVerifying2FA(true);

      try {
        const { data, error } = await authClient.twoFactor.verifyTotp({
          code,
          trustDevice: false,
        });

        if (error) {
          toast.error(error.message || 'Невірний код');
          setTotpCode('');
          return;
        }

        if (data) {
          toast.success('Вхід успішний!');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('[2FA Verify TOTP] Error:', error);
        toast.error('Помилка верифікації коду');
        setTotpCode('');
      } finally {
        setIsVerifying2FA(false);
      }
    } else {
      // Перевірка Backup Code
      const code = codeOverride ?? backupCode;
      const cleanCode = code.replace(/[\s-]/g, '').toUpperCase();

      if (cleanCode.length !== 8) {
        toast.error('Введіть 8-символьний код відновлення');
        return;
      }

      setIsVerifying2FA(true);

      try {
        const { data, error } = await authClient.twoFactor.verifyBackupCode({
          code: cleanCode,
        });

        if (error) {
          toast.error(error.message || 'Невірний або вже використаний код');
          setBackupCode('');
          return;
        }

        if (data) {
          toast.success('Вхід успішний!');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('[2FA Verify Backup] Error:', error);
        toast.error('Помилка верифікації коду');
        setBackupCode('');
      } finally {
        setIsVerifying2FA(false);
      }
    }
  };

  // Обробник для Google OAuth
  const handleGoogleSignIn = async () => {
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      });
    } catch (error) {
      console.error('[Google OAuth] Помилка:', error);
      toast.error('Помилка при вході через Google');
    }
  };

  // Повторна відправка верифікаційного листа
  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;

    const formData = new FormData();
    formData.append('email', unverifiedEmail);

    const result = await resendVerificationAction(null, formData);

    if (result.success) {
      toast.success(result.message || 'Лист відправлено');
      setUnverifiedEmail(null);
    } else {
      toast.error(result.message || 'Помилка відправки листа');
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-6',
        // Фіксована ширина контейнера для коректного відображення
        'w-full max-w-sm', // Mobile: 384px (для TOTP)
        show2FA && useBackupCode && 'max-w-md sm:max-w-lg', // Backup: 448px → 512px
        className
      )}
      {...props}
    >
      <Card className="w-full transition-all duration-300">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Вхід</CardTitle>
          <CardDescription>Увійдіть до свого акаунту</CardDescription>
        </CardHeader>
        <CardContent className={cn(show2FA && useBackupCode && 'px-4 sm:px-6')}>
          {/* Якщо потрібен 2FA - показуємо форму TOTP або Backup Code */}
          {show2FA ? (
            <div className="space-y-4">
              <div className="bg-info/10 rounded-md p-4 text-center">
                <p className="text-info-foreground text-sm">
                  {useBackupCode
                    ? 'Введіть код відновлення для '
                    : 'Введіть 6-значний код з додатку аутентифікації для '}
                  <strong>{twoFactorEmail}</strong>
                </p>
              </div>

              <div className="flex flex-col items-center space-y-4">
                {useBackupCode ? (
                  // Форма для Backup Code (8 символів) - компактний розмір
                  <>
                    <Label htmlFor="backup">Код відновлення (XXXX-XXXX)</Label>
                    <InputOTP
                      maxLength={8}
                      value={backupCode}
                      onChange={(value) => {
                        setBackupCode(value);
                        // Автоматична відправка після введення останнього символу
                        if (value.length === 8 && !isVerifying2FA) {
                          handleVerify2FA(value);
                        }
                      }}
                      autoFocus
                      containerClassName="gap-1 sm:gap-1.5"
                    >
                      <InputOTPGroup className="gap-1 sm:gap-1.5">
                        <InputOTPSlot
                          index={0}
                          className="size-9 text-sm uppercase sm:size-10 sm:text-base"
                        />
                        <InputOTPSlot
                          index={1}
                          className="size-9 text-sm uppercase sm:size-10 sm:text-base"
                        />
                        <InputOTPSlot
                          index={2}
                          className="size-9 text-sm uppercase sm:size-10 sm:text-base"
                        />
                        <InputOTPSlot
                          index={3}
                          className="size-9 text-sm uppercase sm:size-10 sm:text-base"
                        />
                      </InputOTPGroup>
                      <InputOTPSeparator className="mx-1 sm:mx-2" />
                      <InputOTPGroup className="gap-1 sm:gap-1.5">
                        <InputOTPSlot
                          index={4}
                          className="size-9 text-sm uppercase sm:size-10 sm:text-base"
                        />
                        <InputOTPSlot
                          index={5}
                          className="size-9 text-sm uppercase sm:size-10 sm:text-base"
                        />
                        <InputOTPSlot
                          index={6}
                          className="size-9 text-sm uppercase sm:size-10 sm:text-base"
                        />
                        <InputOTPSlot
                          index={7}
                          className="size-9 text-sm uppercase sm:size-10 sm:text-base"
                        />
                      </InputOTPGroup>
                    </InputOTP>
                    <p className="text-muted-foreground text-center text-xs">
                      ⚠️ Кожен код відновлення можна використати лише один раз
                    </p>
                  </>
                ) : (
                  // Форма для TOTP (6 цифр)
                  <>
                    <Label htmlFor="totp">Код аутентифікації</Label>
                    <InputOTP
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS}
                      value={totpCode}
                      onChange={(value) => {
                        setTotpCode(value);
                        // Автоматична відправка після введення останньої цифри
                        if (value.length === 6 && !isVerifying2FA) {
                          handleVerify2FA(value);
                        }
                      }}
                      autoFocus
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="size-12 text-lg" />
                        <InputOTPSlot index={1} className="size-12 text-lg" />
                        <InputOTPSlot index={2} className="size-12 text-lg" />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className="size-12 text-lg" />
                        <InputOTPSlot index={4} className="size-12 text-lg" />
                        <InputOTPSlot index={5} className="size-12 text-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                  </>
                )}

                <div className="flex w-full gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShow2FA(false);
                      setTotpCode('');
                      setBackupCode('');
                      setUseBackupCode(false);
                    }}
                    className="flex-1"
                  >
                    Назад
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleVerify2FA()}
                    disabled={
                      isVerifying2FA ||
                      (!useBackupCode && totpCode.length !== 6) ||
                      (useBackupCode && backupCode.length !== 8)
                    }
                    className="flex-1"
                  >
                    {isVerifying2FA ? 'Перевірка...' : 'Підтвердити'}
                  </Button>
                </div>

                {/* Переключатель между TOTP и Backup Code */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode(!useBackupCode);
                      setTotpCode('');
                      setBackupCode('');
                    }}
                    className="text-info text-sm hover:underline"
                  >
                    {useBackupCode
                      ? 'Використати код з додатку'
                      : 'Немає доступу до додатку? Використати код відновлення'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Звичайна форма логіну */
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6" autoComplete="off">
              {/* Помилки від сервера */}
              {serverError && (
                <div className="bg-destructive/10 text-destructive-foreground rounded-md p-3 text-sm">
                  {serverError}
                </div>
              )}

              {/* Passkey login */}
              <PasskeyLogin />

              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-background text-muted-foreground relative z-10 px-2">
                  Або продовжити з
                </span>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email (буде використовуватися, як логін)</Label>
                <InputGroup>
                  <InputGroupInput
                    id="email"
                    type="email"
                    placeholder="example@gmail.com"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    data-1p-ignore="true"
                    data-lpignore="true"
                    className={errors.email ? 'border-destructive' : ''}
                    autoFocus
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                  <InputGroupAddon>
                    <MailIcon />
                  </InputGroupAddon>
                </InputGroup>
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Пароль</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Забули пароль?
                  </Link>
                </div>
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
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                      aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {/* {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )} */}
              </div>

              {/* Login button */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Вхід...' : 'Увійти'}
              </Button>

              {/* Google OAuth */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 size-5">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Увійти через Google
              </Button>

              {/* Resend verification */}
              {unverifiedEmail && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleResendVerification}
                >
                  Відправити лист верифікації ще раз
                </Button>
              )}
            </form>
          )}

          {/* Register link - показуємо ТІЛЬКИ якщо НЕ 2FA форма */}
          {!show2FA && (
            <div className="mt-4 text-center text-sm">
              Ще немає акаунту?{' '}
              <Link href="/register" className="underline underline-offset-4">
                Зареєструватися
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-muted-foreground hover:[&_a]:text-primary text-center text-xs text-balance [&_a]:underline [&_a]:underline-offset-4">
        Натискаючи продовжити, ви погоджуєтесь з нашими <a href="#">Умовами використання</a> та{' '}
        <a href="#">Політикою конфіденційності</a>.
      </div>
    </div>
  );
}
