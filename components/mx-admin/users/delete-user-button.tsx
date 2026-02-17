'use client';

import { deleteUser } from '@/actions/auth/delete-user';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
}

/**
 * Кнопка видалення користувача з підтвердженням через введення слова DELETE
 */
export const DeleteUserButton = ({ userId, userName }: DeleteUserButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmationWord, setConfirmationWord] = useState('');

  const isConfirmationValid = confirmationWord === 'DELETE';

  const handleDeleteUser = async () => {
    if (!isConfirmationValid) {
      toast.error('Введіть DELETE для підтвердження');
      return;
    }

    setIsLoading(true);
    try {
      const result = await deleteUser(userId, confirmationWord);

      if (result.success) {
        toast.success('Користувача видалено');
        setOpen(false);
        setConfirmationWord('');
      } else {
        toast.error(result.error || 'Помилка видалення користувача');
      }
    } catch {
      toast.error('Виникла помилка при видаленні користувача');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setConfirmationWord('');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isLoading}>
                <Trash2 className="text-destructive h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Видалити користувача</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Видалення користувача</AlertDialogTitle>
          <AlertDialogDescription>
            Ви збираєтеся видалити користувача <strong>{userName}</strong>. Ця дія{' '}
            <strong>незворотна</strong> і призведе до видалення всіх пов&apos;язаних даних.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Введіть <span className="font-mono font-bold">DELETE</span> для підтвердження:
            </Label>
            <Input
              id="confirmation"
              value={confirmationWord}
              onChange={(e) => setConfirmationWord(e.target.value)}
              placeholder="DELETE"
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Скасувати</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteUser}
            disabled={!isConfirmationValid || isLoading}
          >
            {isLoading ? 'Видалення...' : 'Видалити назавжди'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
