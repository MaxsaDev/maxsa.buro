'use client';

import { type ComponentProps, useId, useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordConfirmDialogProps {
  title: string;
  description: string;
  triggerLabel: string;
  actionLabel: string;
  onConfirm: (password: string) => Promise<boolean | void> | boolean | void;
  isLoading?: boolean;
  triggerVariant?: ComponentProps<typeof Button>['variant'];
  triggerClassName?: string;
  actionClassName?: string;
}

export const PasswordConfirmDialog = ({
  title,
  description,
  triggerLabel,
  actionLabel,
  onConfirm,
  isLoading = false,
  triggerVariant = 'outline',
  triggerClassName,
  actionClassName,
}: PasswordConfirmDialogProps) => {
  const inputId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setPassword('');
      setError(null);
    }
  };

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError('Введіть пароль');
      return;
    }

    setError(null);
    const result = await onConfirm(password);
    if (result !== false) {
      setIsOpen(false);
    }
  };

  const actionText = isLoading ? 'Обробка...' : actionLabel;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant={triggerVariant} disabled={isLoading} className={triggerClassName}>
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleConfirm();
          }}
          className="space-y-4"
          autoComplete="off"
        >
          <div className="space-y-2">
            <Label htmlFor={inputId}>Пароль</Label>
            <Input
              id={inputId}
              type="password"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              data-form-type="other"
              data-1p-ignore="true"
              data-lpignore="true"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={!!error}
              disabled={isLoading}
              autoFocus
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Скасувати</AlertDialogCancel>
            <Button type="submit" disabled={isLoading} className={actionClassName}>
              {actionText}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};
