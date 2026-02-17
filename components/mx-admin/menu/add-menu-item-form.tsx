'use client';

import { Check, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { showNotification } from '@/lib/notifications';
import { menuIconSchema, menuTitleSchema, menuUrlSchema } from '@/schemas/mx-admin/menu-schema';
import { IconPickerNew } from './icon-picker-new';

import type { ActionStatus } from '@/interfaces/action-status';

interface AddMenuItemFormProps {
  /** Текст на кнопці тригера */
  triggerLabel: string;
  /** Server Action для створення нового пункту меню */
  onCreate: (
    title: string,
    url: string,
    icon: string,
    categoryId?: number
  ) => Promise<ActionStatus>;
  /** ID категорії (для пунктів меню з секціями) */
  categoryId?: number;
  /** Плейсхолдер для поля назви */
  titlePlaceholder?: string;
  /** Плейсхолдер для поля URL */
  urlPlaceholder?: string;
}

/**
 * Інлайн-форма для додавання нового пункту меню
 */
export function AddMenuItemForm({
  triggerLabel,
  onCreate,
  categoryId,
  titlePlaceholder = 'Назва пункту меню',
  urlPlaceholder = 'URL пункту меню',
}: AddMenuItemFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('/');
  const [icon, setIcon] = useState('Plus');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // URL маска — гарантуємо слеш на початку
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (
      newValue !== '' &&
      !newValue.startsWith('http://') &&
      !newValue.startsWith('https://') &&
      !newValue.startsWith('/')
    ) {
      newValue = '/' + newValue;
    }
    setUrl(newValue);
    if (error) setError(null);
  };

  const handleSave = async () => {
    // Валідація
    const titleResult = menuTitleSchema.safeParse(title);
    if (!titleResult.success) {
      setError(titleResult.error.issues[0]?.message || 'Некоректна назва');
      return;
    }

    const urlResult = menuUrlSchema.safeParse(url);
    if (!urlResult.success) {
      setError(urlResult.error.issues[0]?.message || 'Некоректний URL');
      return;
    }

    const iconResult = menuIconSchema.safeParse(icon);
    if (!iconResult.success) {
      setError(iconResult.error.issues[0]?.message || 'Некоректна іконка');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onCreate(titleResult.data, urlResult.data, iconResult.data, categoryId);
      showNotification(result);

      if (result.status === 'success') {
        setTitle('');
        setUrl('/');
        setIcon('Plus');
        setIsAdding(false);
      }
    } catch {
      setError('Помилка створення пункту меню');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setUrl('/');
    setIcon('Plus');
    setError(null);
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm"
      >
        <Plus className="size-4" />
        {triggerLabel}
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <div className="border-primary/40 bg-primary/5 flex max-w-2xl items-center gap-2 rounded-lg border px-3 py-2.5">
        <IconPickerNew currentIcon={icon} onSelect={setIcon} disabled={isSubmitting} />
        <InputGroup className="flex-1">
          <InputGroupInput
            autoFocus
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={titlePlaceholder}
            disabled={isSubmitting}
          />
        </InputGroup>
        <InputGroup className="flex-1">
          <InputGroupInput
            value={url}
            onChange={handleUrlChange}
            onKeyDown={handleKeyDown}
            placeholder={urlPlaceholder}
            disabled={isSubmitting}
          />
        </InputGroup>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          className="text-primary hover:bg-primary/10 flex size-7 items-center justify-center rounded-md"
          aria-label="Зберегти"
        >
          <Check className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="text-muted-foreground hover:bg-muted flex size-7 items-center justify-center rounded-md"
          aria-label="Скасувати"
        >
          <X className="size-4" />
        </button>
      </div>
      {error && <p className="text-destructive px-3 text-xs">{error}</p>}
    </div>
  );
}
