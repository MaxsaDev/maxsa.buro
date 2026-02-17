'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, UnlockIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { resetPasswordAction } from '@/actions/auth/reset-password';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { newPasswordFormSchema } from '@/schemas/auth/schema-auth';

type NewPasswordFormValues = z.infer<typeof newPasswordFormSchema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Стан показу паролів
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
    setError,
  } = useForm<NewPasswordFormValues>({
    resolver: zodResolver(newPasswordFormSchema),
    mode: 'onSubmit', // Валідація тільки при submit
  });

  // Спостерігаємо за значеннями для валідації
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const onSubmit = async (data: NewPasswordFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const formData = new FormData();
      formData.append('password', data.password);
      formData.append('confirmPassword', data.confirmPassword);

      const result = await resetPasswordAction(token || '', null, formData);

      if (!result.success) {
        // Обробляємо помилки валідації з сервера
        if (result.errors) {
          if (result.errors.password) {
            setError('password', { message: result.errors.password[0] });
          }
          if (result.errors.confirmPassword) {
            setError('confirmPassword', { message: result.errors.confirmPassword[0] });
          }
        }

        setServerError(result.message || 'Помилка зміни паролю');
        toast.error(result.message || 'Помилка зміни паролю');
      }
      // Якщо success - відбудеться redirect в Server Action
    } catch (error) {
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        return;
      }

      console.error('[Reset Password Form] Помилка:', error);
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Помилка</CardTitle>
          <CardDescription>Посилання для скидання паролю недійсне або відсутнє</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/forgot-password"
            className="text-primary block text-center underline-offset-4 hover:underline"
          >
            Запитати нове посилання
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Новий пароль</CardTitle>
        <CardDescription>Введіть ваш новий пароль нижче</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <div className="grid gap-4">
            {/* Повідомлення про помилку НАВЕРХУ */}
            {serverError && (
              <div className="bg-destructive/10 text-destructive-foreground rounded-md p-3 text-sm">
                {serverError}
              </div>
            )}

            {/* Список помилок валідації НАВЕРХУ */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-destructive/10 text-destructive-foreground rounded-md p-3 text-sm">
                <ul className="list-inside list-disc space-y-1">
                  {errors.password && <li>{errors.password.message}</li>}
                  {errors.confirmPassword && <li>{errors.confirmPassword.message}</li>}
                </ul>
              </div>
            )}

            {/* Поле Новий пароль */}
            <div className="grid gap-2">
              <Label htmlFor="password">Новий пароль</Label>
              <InputGroup
                className={cn(
                  touchedFields.password && !errors.password && password && password.length >= 8
                    ? 'border-success border'
                    : ''
                )}
              >
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
                  autoFocus
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                <InputGroupAddon>
                  <UnlockIcon />
                </InputGroupAddon>
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
                </InputGroupAddon>
              </InputGroup>
            </div>

            {/* Поле Підтвердження паролю */}
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Підтвердіть пароль</Label>
              <InputGroup
                className={cn(
                  touchedFields.confirmPassword &&
                    !errors.confirmPassword &&
                    confirmPassword &&
                    confirmPassword.length >= 8 &&
                    confirmPassword === password
                    ? 'border-success border'
                    : ''
                )}
              >
                <InputGroupAddon>
                  <UnlockIcon />
                </InputGroupAddon>
                <InputGroupInput
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
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
                </InputGroupAddon>
              </InputGroup>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Зміна паролю...' : 'Змінити пароль'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
