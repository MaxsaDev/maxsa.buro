'use client';

import { disablePasskey } from '@/actions/auth/disable-passkey';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface DisablePasskeyButtonProps {
  userId: string;
  hasPasskey: boolean;
  disabled?: boolean;
}

/**
 * Кнопка відключення всіх Passkey користувача
 */
export const DisablePasskeyButton = ({
  userId,
  hasPasskey,
  disabled,
}: DisablePasskeyButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDisablePasskey = async () => {
    setIsLoading(true);
    try {
      const result = await disablePasskey(userId);

      if (result.success) {
        toast.success('Всі Passkey видалено');
        setOpen(false);
      } else {
        toast.error(result.error || 'Помилка видалення Passkey');
      }
    } catch {
      toast.error('Виникла помилка при видаленні Passkey');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!hasPasskey || disabled || isLoading}>
                <KeyRound className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasPasskey ? 'Видалити всі Passkey' : 'Passkey не зареєстровано'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Підтвердження видалення Passkey</AlertDialogTitle>
          <AlertDialogDescription>
            Ви впевнені, що хочете видалити всі Passkey цього користувача? Користувачу доведеться
            зареєструвати їх заново для використання.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Скасувати</AlertDialogCancel>
          <AlertDialogAction onClick={handleDisablePasskey} disabled={isLoading}>
            {isLoading ? 'Обробка...' : 'Підтвердити'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
