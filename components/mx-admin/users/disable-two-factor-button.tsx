'use client';

import { disableTwoFactor } from '@/actions/auth/disable-two-factor';
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
import { ShieldOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface DisableTwoFactorButtonProps {
  userId: string;
  twoFactorEnabled: boolean;
  disabled?: boolean;
}

/**
 * Кнопка відключення 2FA користувача
 */
export const DisableTwoFactorButton = ({
  userId,
  twoFactorEnabled,
  disabled,
}: DisableTwoFactorButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDisableTwoFactor = async () => {
    setIsLoading(true);
    try {
      const result = await disableTwoFactor(userId);

      if (result.success) {
        toast.success('2FA відключено');
        setOpen(false);
      } else {
        toast.error(result.error || 'Помилка відключення 2FA');
      }
    } catch {
      toast.error('Виникла помилка при відключенні 2FA');
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
              <Button
                variant="ghost"
                size="icon"
                disabled={!twoFactorEnabled || disabled || isLoading}
              >
                <ShieldOff className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{twoFactorEnabled ? 'Відключити 2FA' : '2FA не увімкнено'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Підтвердження відключення 2FA</AlertDialogTitle>
          <AlertDialogDescription>
            Ви впевнені, що хочете відключити двофакторну автентифікацію для цього користувача? Це
            може знизити безпеку облікового запису.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Скасувати</AlertDialogCancel>
          <AlertDialogAction onClick={handleDisableTwoFactor} disabled={isLoading}>
            {isLoading ? 'Обробка...' : 'Підтвердити'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
