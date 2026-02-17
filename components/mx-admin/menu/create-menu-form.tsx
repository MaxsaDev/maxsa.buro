'use client';

import { useRouter } from 'next/navigation';
import { Check, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { createMenuAction } from '@/actions/mx-admin/menu/menus';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { showNotification } from '@/lib/notifications';
import { menuTitleSchema } from '@/schemas/mx-admin/menu-schema';

interface CreateMenuFormProps {
  menuTypeId: number;
  onSuccess?: () => void;
}

export function CreateMenuForm({ menuTypeId, onSuccess }: CreateMenuFormProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    // Валідація
    const titleResult = menuTitleSchema.safeParse(title);
    if (!titleResult.success) {
      setError(titleResult.error.issues[0]?.message || 'Некоректне значення');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createMenuAction(titleResult.data, menuTypeId);
      showNotification(result);

      if (result.status === 'success') {
        setTitle('');
        setIsAdding(false);
        router.refresh();
        onSuccess?.();
      }
    } catch {
      setError('Помилка створення меню');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
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
      <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
        <Plus className="mr-2 size-4" />
        Нове меню
      </Button>
    );
  }

  return (
    <div className="space-y-1">
      <div className="border-primary/40 bg-primary/5 flex items-center gap-2 rounded-lg border px-3 py-2.5">
        <InputGroup className="flex-1">
          <InputGroupInput
            ref={inputRef}
            autoFocus
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Назва нового меню"
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
