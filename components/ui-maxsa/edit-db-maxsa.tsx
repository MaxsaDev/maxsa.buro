'use client';

import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import type { ActionStatus } from '@/interfaces/action-status';
import { showNotification } from '@/lib/notifications';
import { cn } from '@/lib/utils';

interface EditDbMaxsaProps {
  /** ID записи в БД (може бути число або рядок для UUID) */
  id: number | string;
  /** Поточне значення поля */
  value: string;
  /** Zod схема для валідації */
  schema: z.ZodSchema<string>;
  /** Server Action для збереження даних */
  onSave: (id: number | string, value: string) => Promise<ActionStatus>;
  /** Callback після успішного збереження */
  onSuccess?: () => void;
  /** Плейсхолдер для поля вводу */
  placeholder?: string;
  /** Тип поля: text, url, textarea */
  type?: 'text' | 'url' | 'textarea';
  /** Чи заблоковано редагування */
  disabled?: boolean;
  /** Додаткові класи для контейнера */
  className?: string;
  /** Кастомна іконка для кнопки збереження */
  saveIcon?: React.ReactNode;
  /** Кастомна іконка для кнопки скасування */
  cancelIcon?: React.ReactNode;
}

/**
 * Універсальний компонент для редагування текстових даних в БД
 * Підтримує стани: default, dirty (orange border), error (red border)
 * Валідація відбувається тільки при натисканні кнопки "Зберегти"
 */
export function EditDbMaxsa({
  id,
  value: initialValue,
  schema,
  onSave,
  onSuccess,
  placeholder,
  type = 'text',
  disabled = false,
  className,
  saveIcon,
  cancelIcon,
}: EditDbMaxsaProps) {
  // Зберігаємо початкове значення для можливості відкату
  const [originalValue, setOriginalValue] = useState(initialValue);
  // Поточне значення в input
  const [currentValue, setCurrentValue] = useState(initialValue);
  // Стан завантаження при збереженні
  const [isLoading, setIsLoading] = useState(false);
  // Помилка валідації
  const [validationError, setValidationError] = useState<string | null>(null);

  // Визначаємо чи значення змінилося (dirty state)
  const isDirty = currentValue !== originalValue;
  // Чи є помилка валідації
  const hasError = validationError !== null;

  // Синхронізація з пропсом value (коли дані оновлюються з сервера)
  useEffect(() => {
    // Оновлюємо значення тільки якщо воно змінилося ззовні і ми не в стані редагування
    if (initialValue !== originalValue && !isDirty) {
      setOriginalValue(initialValue);
      setCurrentValue(initialValue);
    }
  }, [initialValue, originalValue, isDirty]);

  // Обробка зміни значення
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    // Для URL полів гарантуємо слеш на початку (якщо не повний URL)
    if (
      type === 'url' &&
      newValue !== '' &&
      !newValue.startsWith('http://') &&
      !newValue.startsWith('https://') &&
      !newValue.startsWith('/')
    ) {
      newValue = '/' + newValue;
    }
    setCurrentValue(newValue);
    // Очищаємо помилку валідації при зміні значення
    if (validationError) {
      setValidationError(null);
    }
  };

  // Обробка збереження
  const handleSave = async () => {
    // Валідація через Zod схему
    const validation = schema.safeParse(currentValue);

    if (!validation.success) {
      const errors = validation.error.flatten().formErrors;
      const errorMessage = errors[0] || 'Некоректне значення';
      setValidationError(errorMessage);
      showNotification({
        status: 'error',
        message: errorMessage,
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Якщо значення не змінилося, нічого не робимо
    if (!isDirty) {
      return;
    }

    setIsLoading(true);
    setValidationError(null);

    try {
      // Викликаємо Server Action
      const result = await onSave(id, validation.data);

      // Показуємо повідомлення про результат
      showNotification(result);

      if (result.status === 'success') {
        // При успішному збереженні оновлюємо початкове значення
        setOriginalValue(validation.data);
        // Викликаємо callback після успішного збереження (якщо вказано)
        onSuccess?.();
      } else {
        // При помилці залишаємо поточне значення, але показуємо помилку
        // Користувач може виправити та спробувати ще раз
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
      setValidationError(errorMessage);
      showNotification({
        status: 'error',
        message: errorMessage,
        code: 'UNKNOWN_ERROR',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Обробка скасування змін
  const handleCancel = () => {
    setCurrentValue(originalValue);
    setValidationError(null);
  };

  // Обробка клавіш: Enter — зберегти, Escape — скасувати
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isDirty) {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Enter' && isDirty) {
      e.preventDefault();
      handleSave();
    }
  };

  // Визначаємо класи для border в залежності від стану
  // InputGroup має вбудовану підтримку aria-invalid для error стану,
  // тому для dirty стану використовуємо кастомні класи
  const borderClasses = cn(
    // Dirty state - акцентний warning border (тільки якщо немає помилки)
    isDirty && !hasError && '!border-warning'
  );

  // Визначаємо який компонент використовувати (Input або Textarea)
  const InputComponent = type === 'textarea' ? InputGroupTextarea : InputGroupInput;

  return (
    <InputGroup
      className={cn(
        // Обмежуємо максимальну ширину для кращого UX
        // max-w-lg (32rem / 512px) - оптимальна ширина для редагування без розтягування на весь екран
        // Користувач може перевизначити через className (наприклад, max-w-full або max-w-xl)
        'max-w-lg',
        borderClasses,
        className
      )}
    >
      <InputComponent
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        type={type === 'url' ? 'url' : 'text'}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
      />
      {isDirty && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            onClick={handleSave}
            disabled={isLoading}
            aria-label="Зберегти зміни"
            className="text-success hover:bg-success/10 hover:text-success"
          >
            {saveIcon || <Check className="size-4" />}
          </InputGroupButton>
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="Скасувати зміни"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {cancelIcon || <X className="size-4" />}
          </InputGroupButton>
        </InputGroupAddon>
      )}
      {hasError && (
        <span id={`${id}-error`} className="sr-only" role="alert">
          {validationError}
        </span>
      )}
    </InputGroup>
  );
}
