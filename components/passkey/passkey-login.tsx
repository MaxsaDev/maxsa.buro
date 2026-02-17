'use client';

/**
 * Passkey Login Component
 * Кнопка для входу через Passkey на login сторінці
 * ВИКОРИСТОВУЄ ОФІЦІЙНИЙ Better Auth Passkey Plugin API
 */

import { Fingerprint, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth/auth-client';
import { isWebAuthnAvailable } from '@/lib/auth/passkey/webauthn-client';

interface PasskeyLoginProps {
  email?: string;
  onSuccess?: () => void;
}

/**
 * Кнопка для входу через Passkey на сторінці логіну.
 */
export function PasskeyLogin({ email: _email, onSuccess }: PasskeyLoginProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isClient, setIsClient] = useState(false);

  /**
   * Очікує появу сесії після успішної автентифікації.
   */
  const waitForSession = async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        const { data } = await authClient.getSession();
        if (data?.user) {
          return true;
        }
      } catch {
        // Ігноруємо, поки сесія ще не з'явилась
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return false;
  };

  // Перевірка підтримки WebAuthn тільки на клієнті (після hydration)
  useEffect(() => {
    setIsClient(true);
    setIsSupported(isWebAuthnAvailable());
  }, []);

  const handlePasskeyLogin = async () => {
    setIsLoading(true);

    try {
      // Викликаємо офіційний Better Auth passkey API
      const { error } = await authClient.signIn.passkey();

      if (error) {
        // Перевіряємо чи це відміна користувачем (не помилка)
        const errorMessage = error.message?.toLowerCase() || '';
        const isUserCancelled =
          errorMessage.includes('cancelled') ||
          errorMessage.includes('not allowed') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('abort');

        if (isUserCancelled) {
          // Користувач відмінив - не показуємо помилку, просто виходимо
          return;
        }

        // Реальна помилка - показуємо зрозуміле повідомлення
        toast.error(
          'Помилка входу через Passkey. Спробуйте ще раз або використайте інший спосіб входу.'
        );
        return;
      }

      // Успіх! Показуємо повідомлення і редіректимо
      toast.success('Вхід успішний!');

      // Викликаємо callback якщо переданий
      onSuccess?.();

      // Редіректимо на dashboard після появи сесії
      const hasSession = await waitForSession();
      if (hasSession) {
        router.replace('/dashboard');
        router.refresh();
      } else {
        window.location.assign('/dashboard');
      }
    } catch (error: unknown) {
      // Неочікувана помилка - показуємо загальне повідомлення
      const errorMessage =
        error instanceof Error && error.message?.toLowerCase().includes('cancelled')
          ? null // Відміна користувачем - не показуємо помилку
          : 'Помилка входу через Passkey. Спробуйте ще раз або використайте інший спосіб входу.';

      if (errorMessage) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Не рендеримо нічого до hydration (запобігає hydration mismatch)
  if (!isClient) {
    return null;
  }

  // Ховаємо кнопку якщо WebAuthn не підтримується
  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      onClick={handlePasskeyLogin}
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Аутентифікація...
        </>
      ) : (
        <>
          <Fingerprint className="mr-2 size-4" />
          Увійти через Passkey
        </>
      )}
    </Button>
  );
}
