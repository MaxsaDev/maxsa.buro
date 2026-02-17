'use client';

import { Check, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import type { ActionStatus } from '@/interfaces/action-status';
import { showNotification } from '@/lib/notifications';
import {
  permissionDescriptionSchema,
  permissionIconSchema,
  permissionTitleSchema,
} from '@/schemas/mx-admin/permissions-schema';
import { IconPickerNew } from '../menu/icon-picker-new';

interface AddPermissionCategoryFormProps {
  /** Текст на кнопці тригера */
  triggerLabel: string;
  /** Server Action для створення нової категорії повноважень */
  onCreate: (title: string, description: string | null, icon: string) => Promise<ActionStatus>;
}

/**
 * Інлайн-форма для додавання нової категорії повноважень
 */
export function AddPermissionCategoryForm({
  triggerLabel,
  onCreate,
}: AddPermissionCategoryFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('CircleCheck');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    // Валідація
    const titleResult = permissionTitleSchema.safeParse(title);
    if (!titleResult.success) {
      setError(titleResult.error.issues[0]?.message || 'Некоректна назва');
      return;
    }

    const descTrimmed = description.trim();
    if (descTrimmed) {
      const descResult = permissionDescriptionSchema.safeParse(descTrimmed);
      if (descResult !== undefined && !descResult.success) {
        setError(descResult.error.issues[0]?.message || 'Некоректний опис');
        return;
      }
    }

    const iconResult = permissionIconSchema.safeParse(icon);
    if (!iconResult.success) {
      setError(iconResult.error.issues[0]?.message || 'Некоректна іконка');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onCreate(titleResult.data, descTrimmed || null, iconResult.data);
      showNotification(result);

      if (result.status === 'success') {
        setTitle('');
        setDescription('');
        setIcon('CircleCheck');
        setIsAdding(false);
      }
    } catch {
      setError('Помилка створення категорії повноважень');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setIcon('CircleCheck');
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
            placeholder="Назва категорії повноважень"
            disabled={isSubmitting}
          />
        </InputGroup>
        <InputGroup className="flex-1">
          <InputGroupInput
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Опис (необовʼязково)"
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
