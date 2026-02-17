'use client';

import { toggleUserRole } from '@/actions/auth/toggle-user-role';
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
import { Crown, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ToggleRoleButtonProps {
  userId: string;
  currentRole: string;
  disabled?: boolean;
}

/**
 * Кнопка зміни ролі користувача (user <-> admin)
 */
export const ToggleRoleButton = ({ userId, currentRole, disabled }: ToggleRoleButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const isAdmin = currentRole === 'admin';
  const actionText = isAdmin ? 'Понизити до користувача' : 'Підвищити до адміністратора';
  const Icon = isAdmin ? User : Crown;

  const handleToggleRole = async () => {
    setIsLoading(true);
    try {
      const result = await toggleUserRole(userId);

      if (result.success) {
        toast.success(isAdmin ? 'Користувача понижено до user' : 'Користувача підвищено до admin');
        setOpen(false);
      } else {
        toast.error(result.error || 'Помилка зміни ролі');
      }
    } catch {
      toast.error('Виникла помилка при зміні ролі');
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
                <Icon className={isAdmin ? 'h-4 w-4' : 'text-warning h-4 w-4'} />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{actionText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Підтвердження зміни ролі</AlertDialogTitle>
          <AlertDialogDescription>
            Ви впевнені, що хочете{' '}
            {isAdmin ? 'понизити користувача до user' : 'підвищити користувача до admin'}? Ця дія
            вплине на права доступу користувача.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Скасувати</AlertDialogCancel>
          <AlertDialogAction onClick={handleToggleRole} disabled={isLoading}>
            {isLoading ? 'Обробка...' : 'Підтвердити'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
