'use client';

import { toggleBan } from '@/actions/auth/toggle-ban';
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
import { Ban, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ToggleBanButtonProps {
  userId: string;
  isBanned: boolean;
  disabled?: boolean;
}

/**
 * Кнопка бану/розбану користувача
 */
export const ToggleBanButton = ({ userId, isBanned, disabled }: ToggleBanButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const actionText = isBanned ? 'Розбанити' : 'Забанити';
  const Icon = isBanned ? CheckCircle : Ban;

  const handleToggleBan = async () => {
    setIsLoading(true);
    try {
      const result = await toggleBan(userId);

      if (result.success) {
        toast.success(isBanned ? 'Користувача розбанено' : 'Користувача забанено');
        setOpen(false);
      } else {
        toast.error(result.error || 'Помилка зміни статусу бану');
      }
    } catch {
      toast.error('Виникла помилка при зміні статусу бану');
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
              <Button variant="ghost" size="icon" disabled={disabled || isLoading}>
                <Icon className={isBanned ? 'text-success h-4 w-4' : 'text-destructive h-4 w-4'} />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{actionText} користувача</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Підтвердження зміни статусу</AlertDialogTitle>
          <AlertDialogDescription>
            Ви впевнені, що хочете {isBanned ? 'розбанити' : 'забанити'} цього користувача?{' '}
            {!isBanned && 'Забанений користувач не зможе увійти в систему.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Скасувати</AlertDialogCancel>
          <AlertDialogAction onClick={handleToggleBan} disabled={isLoading}>
            {isLoading ? 'Обробка...' : 'Підтвердити'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
