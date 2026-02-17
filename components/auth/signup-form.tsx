'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, InfoIcon, MailIcon } from 'lucide-react';
import Link from 'next/link';
import { type ComponentProps, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { registerAction } from '@/actions/auth/register';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { registerSchema, type RegisterFormValues } from '@/schemas/auth/schema-auth';

export function SignupForm({ className, ...props }: ComponentProps<'div'>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Стан показу паролів
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    setError,
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit', // Валідація тільки при submit
  });

  // Слідкуємо за значеннями полів для перевірки чи вони не порожні
  const emailValue = watch('email');
  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');

  // Перевірка валідності email через zod схему
  const isEmailValid = emailValue && registerSchema.shape.email.safeParse(emailValue).success;

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Створюємо FormData для Server Action
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('confirmPassword', data.confirmPassword);

      const result = await registerAction(null, formData);

      if (!result.success) {
        // Обробляємо помилки валідації з сервера
        if (result.errors) {
          if (result.errors.email) {
            setError('email', { message: result.errors.email[0] });
          }
          if (result.errors.password) {
            setError('password', { message: result.errors.password[0] });
          }
          if (result.errors.confirmPassword) {
            setError('confirmPassword', { message: result.errors.confirmPassword[0] });
          }
        }

        setServerError(result.message || 'Помилка реєстрації');
        toast.error(result.message || 'Помилка реєстрації');
      }
      // Якщо success - відбудеться redirect в Server Action
    } catch (error) {
      // Перехоплюємо redirect (це не помилка)
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        // Redirect успішний, не обробляємо як помилку
        return;
      }

      console.error('[Signup Form] Помилка:', error);
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Створення аккаунту</CardTitle>
          <CardDescription>Введіть вашу електронну пошту для створення аккаунту</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <div className="grid gap-4">
              {/* Повідомлення про помилку */}
              {serverError && (
                <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                  {serverError}
                </div>
              )}

              {/* Список помилок валідації */}
              {Object.keys(errors).length > 0 && (
                <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                  <ul className="list-inside list-disc space-y-1">
                    {errors.email && <li>{errors.email.message}</li>}
                    {errors.password && <li>{errors.password.message}</li>}
                    {errors.confirmPassword && <li>{errors.confirmPassword.message}</li>}
                  </ul>
                </div>
              )}

              {/* Поле Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email (буде використовуватися, як логін)</Label>
                <InputGroup
                  className={cn(
                    emailValue && isEmailValid && !errors.email ? 'border-success border' : ''
                  )}
                >
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
                    autoFocus
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                  <InputGroupAddon>
                    <MailIcon />
                  </InputGroupAddon>
                </InputGroup>
              </div>

              {/* Поля Пароль - вертикально */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">Пароль</Label>
                  <InputGroup
                    className={cn(
                      touchedFields.password &&
                        !errors.password &&
                        passwordValue &&
                        passwordValue.length >= 8
                        ? 'border-success border'
                        : ''
                    )}
                  >
                    <InputGroupInput
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      data-1p-ignore="true"
                      data-lpignore="true"
                      aria-invalid={!!errors.password}
                      {...register('password')}
                    />

                    <InputGroupAddon align="inline-end">
                      {/* Кнопка показати/сховати пароль */}
                      <InputGroupButton
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                        aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </InputGroupButton>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InputGroupButton variant="ghost" aria-label="Info" size="icon-xs">
                            <InfoIcon />
                          </InputGroupButton>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Мінімум 8 символів</p>
                        </TooltipContent>
                      </Tooltip>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Підтвердження пароля</Label>
                  <InputGroup
                    className={cn(
                      touchedFields.confirmPassword &&
                        !errors.confirmPassword &&
                        confirmPasswordValue &&
                        confirmPasswordValue.length >= 8 &&
                        confirmPasswordValue === passwordValue
                        ? 'border-success border'
                        : ''
                    )}
                  >
                    <InputGroupInput
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      data-1p-ignore="true"
                      data-lpignore="true"
                      aria-invalid={!!errors.confirmPassword}
                      {...register('confirmPassword')}
                    />
                    <InputGroupAddon align="inline-end">
                      {/* Кнопка показати/сховати пароль */}
                      <InputGroupButton
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        type="button"
                        aria-label={showConfirmPassword ? 'Сховати пароль' : 'Показати пароль'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </InputGroupButton>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InputGroupButton variant="ghost" aria-label="Info" size="icon-xs">
                            <InfoIcon />
                          </InputGroupButton>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Паролі мають збігатися</p>
                        </TooltipContent>
                      </Tooltip>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </div>

              {/* Кнопка Submit */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Створення...' : 'Створити аккаунт'}
              </Button>

              <div className="text-center text-sm">
                Вже маєте аккаунт?{' '}
                <Link href="/login" className="underline underline-offset-4 hover:underline">
                  Вхід
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground [&_a]:hover:text-primary text-center text-xs text-balance [&_a]:underline [&_a]:underline-offset-4">
        Натиснувши продовжити, ви погоджуєтесь з нашими <a href="#">Умовами сервісу</a> і{' '}
        <a href="#">Політикою конфіденційності</a>.
      </div>
    </div>
  );
}
