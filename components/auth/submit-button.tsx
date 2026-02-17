'use client';

import { Loader2 } from 'lucide-react';
import { ComponentProps } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';

interface SubmitButtonProps extends Omit<ComponentProps<typeof Button>, 'type' | 'disabled'> {
  children: React.ReactNode;
}

/**
 * Кнопка Submit з автоматичним індикатором завантаження
 * Використовує useFormStatus для відображення стану форми
 */
export const SubmitButton = ({ children, ...props }: SubmitButtonProps) => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Завантаження...
        </>
      ) : (
        children
      )}
    </Button>
  );
};

SubmitButton.displayName = 'SubmitButton';
