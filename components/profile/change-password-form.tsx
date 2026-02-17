'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';

import { changePasswordAction } from '@/actions/auth/change-password';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { ProfileAlert } from '@/components/profile/shared';

// Схема валідації для зміни пароля
const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, { message: 'Поточний пароль має містити щонайменше 8 символів' }),
    newPassword: z.string().min(8, { message: 'Новий пароль має містити щонайменше 8 символів' }),
    confirmPassword: z
      .string()
      .min(8, { message: 'Підтвердження паролю має містити щонайменше 8 символів' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Паролі не співпадають',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Новий пароль не може збігатися з поточним',
    path: ['newPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  // Стан показу паролів
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    setError,
    reset,
    watch,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onSubmit',
  });

  // Слідкуємо за значеннями полів для перевірки чи вони не порожні
  const currentPasswordValue = watch('currentPassword');
  const newPasswordValue = watch('newPassword');
  const confirmPasswordValue = watch('confirmPassword');

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    setServerSuccess(null);

    try {
      const formData = new FormData();
      formData.append('currentPassword', data.currentPassword);
      formData.append('newPassword', data.newPassword);
      formData.append('confirmPassword', data.confirmPassword);

      const result = await changePasswordAction(null, formData);

      if (result.success) {
        setServerSuccess(result.message || 'Пароль успішно змінено');
        toast.success(result.message || 'Пароль успішно змінено');
        reset(); // Очищаємо форму після успішної зміни
      } else {
        if (result.errors) {
          if (result.errors.currentPassword) {
            setError('currentPassword', { message: result.errors.currentPassword[0] });
          }
          if (result.errors.newPassword) {
            setError('newPassword', { message: result.errors.newPassword[0] });
          }
          if (result.errors.confirmPassword) {
            setError('confirmPassword', { message: result.errors.confirmPassword[0] });
          }
        }

        setServerError(result.message || 'Помилка зміни пароля');
        toast.error(result.message || 'Помилка зміни пароля');
      }
    } catch (error) {
      console.error('[Change Password Form] Помилка:', error);
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
      {/* Повідомлення про успіх */}
      {serverSuccess && <ProfileAlert variant="success">{serverSuccess}</ProfileAlert>}

      {/* Повідомлення про помилку */}
      {serverError && <ProfileAlert variant="error">{serverError}</ProfileAlert>}

      {/* Список помилок валідації */}
      {!serverError && Object.keys(errors).length > 0 && (
        <ProfileAlert variant="error">
          <ul className="list-inside list-disc space-y-1">
            {errors.currentPassword && <li>{errors.currentPassword.message}</li>}
            {errors.newPassword && <li>{errors.newPassword.message}</li>}
            {errors.confirmPassword && <li>{errors.confirmPassword.message}</li>}
          </ul>
        </ProfileAlert>
      )}

      {/* Поточний пароль */}
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Поточний пароль</Label>
        <InputGroup>
          <InputGroupInput
            id="currentPassword"
            type={showCurrentPassword ? 'text' : 'password'}
            placeholder="Введіть поточний пароль (мінімум 8 символів)"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-1p-ignore="true"
            data-lpignore="true"
            autoFocus
            aria-invalid={!!errors.currentPassword}
            {...register('currentPassword')}
          />
          <InputGroupAddon align="inline-end">
            {/* Зелена галочка */}
            {touchedFields.currentPassword &&
              !errors.currentPassword &&
              currentPasswordValue &&
              currentPasswordValue.length >= 8 && <CheckCircle2 className="text-success size-5" />}
            {/* Кнопка показати/сховати пароль */}
            <InputGroupButton
              size="icon-xs"
              variant="ghost"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              type="button"
              aria-label={showCurrentPassword ? 'Сховати пароль' : 'Показати пароль'}
              className="text-muted-foreground hover:text-foreground"
            >
              {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Новий пароль */}
      <div className="space-y-2">
        <Label htmlFor="newPassword">Новий пароль</Label>
        <InputGroup>
          <InputGroupInput
            id="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            placeholder="Мінімум 8 символів"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-1p-ignore="true"
            data-lpignore="true"
            aria-invalid={!!errors.newPassword}
            {...register('newPassword')}
          />
          <InputGroupAddon align="inline-end">
            {/* Зелена галочка */}
            {touchedFields.newPassword &&
              !errors.newPassword &&
              newPasswordValue &&
              newPasswordValue.length >= 8 && <CheckCircle2 className="text-success size-5" />}
            {/* Кнопка показати/сховати пароль */}
            <InputGroupButton
              size="icon-xs"
              variant="ghost"
              onClick={() => setShowNewPassword(!showNewPassword)}
              type="button"
              aria-label={showNewPassword ? 'Сховати пароль' : 'Показати пароль'}
              className="text-muted-foreground hover:text-foreground"
            >
              {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Підтвердження нового пароля */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Підтвердження нового пароля</Label>
        <InputGroup>
          <InputGroupInput
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Повторіть новий пароль (мінімум 8 символів)"
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
            {/* Зелена галочка */}
            {touchedFields.confirmPassword &&
              !errors.confirmPassword &&
              confirmPasswordValue &&
              confirmPasswordValue.length >= 8 &&
              confirmPasswordValue === newPasswordValue && (
                <CheckCircle2 className="text-success size-5" />
              )}
            {/* Кнопка показати/сховати пароль */}
            <InputGroupButton
              size="icon-xs"
              variant="ghost"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              type="button"
              aria-label={showConfirmPassword ? 'Сховати пароль' : 'Показати пароль'}
              className="text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Кнопка Submit */}
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? 'Зміна...' : 'Змінити пароль'}
      </Button>
    </form>
  );
}
