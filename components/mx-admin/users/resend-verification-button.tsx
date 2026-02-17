'use client';

import { resendVerification } from '@/actions/auth/resend-verification';
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
import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ResendVerificationButtonProps {
  userEmail: string;
  emailVerified: boolean;
  disabled?: boolean;
}

/**
 * Кнопка повторної відправки верифікаційного листа
 */
export const ResendVerificationButton = ({
  userEmail,
  emailVerified,
  disabled,
}: ResendVerificationButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      const result = await resendVerification(userEmail);

      if (result.success) {
        toast.success('Лист верифікації відправлено');
        setOpen(false);
      } else {
        toast.error(result.error || 'Помилка відправки листа');
      }
    } catch {
      toast.error('Виникла помилка при відправці листа');
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
              <Button variant="ghost" size="icon" disabled={emailVerified || disabled || isLoading}>
                <MailCheck className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{emailVerified ? 'Email вже підтверджено' : 'Відправити лист верифікації'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Підтвердження відправки листа</AlertDialogTitle>
          <AlertDialogDescription>
            Відправити повторний лист верифікації на адресу <strong>{userEmail}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Скасувати</AlertDialogCancel>
          <AlertDialogAction onClick={handleResendVerification} disabled={isLoading}>
            {isLoading ? 'Відправка...' : 'Відправити'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
