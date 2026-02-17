'use client';

/**
 * Passkey Setup Component
 * Компонент для додавання нового passkey в профілі користувача
 * ВИКОРИСТОВУЄ ОФІЦІЙНИЙ Better Auth Passkey Plugin API
 */

import { Fingerprint, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ProfileAlert } from '@/components/profile/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth/auth-client';
import {
  getAuthenticatorIcon,
  isPlatformAuthenticatorAvailable,
  isWebAuthnAvailable,
} from '@/lib/auth/passkey/webauthn-client';

interface PasskeySetupProps {
  onSuccess?: () => void;
  hasPasskeys?: boolean;
}

export function PasskeySetup({ onSuccess, hasPasskeys }: PasskeySetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(false);
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false);
  const [passkeyName, setPasskeyName] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Перевірка підтримки WebAuthn при монтуванні (тільки на клієнті)
  useEffect(() => {
    setIsClient(true);
    setIsWebAuthnSupported(isWebAuthnAvailable());
    isPlatformAuthenticatorAvailable().then(setIsPlatformAvailable);
  }, []);

  const handleAddPasskey = async () => {
    setIsLoading(true);

    try {
      // Викликаємо офіційний Better Auth passkey API
      const result = await authClient.passkey.addPasskey({
        name: passkeyName || undefined,
        authenticatorAttachment: isPlatformAvailable ? 'platform' : 'cross-platform',
      });

      if (result?.error) {
        console.error('[PasskeySetup] Error:', result.error);

        // Перевіряємо чи користувач просто відмінив дію (не показуємо помилку)
        const errorMessage = result.error.message || '';
        const isUserCancelled =
          errorMessage.includes('timeout') ||
          errorMessage.includes('not allowed') ||
          errorMessage.includes('cancelled');

        if (!isUserCancelled) {
          toast.error(result.error.message || 'Помилка додавання passkey');
        }
        return;
      }

      // Успіх!
      console.log('[PasskeySetup] Passkey added:', result?.data);
      toast.success('Passkey успішно додано!');
      setPasskeyName('');
      onSuccess?.();
    } catch (error: unknown) {
      console.error('[PasskeySetup] Unexpected error:', error);
      // Не показуємо помилку якщо це відміна користувача
      if (error instanceof Error) {
        const isUserCancelled =
          error.message.includes('timeout') ||
          error.message.includes('not allowed') ||
          error.message.includes('cancelled');
        if (!isUserCancelled) {
          toast.error('Помилка додавання passkey');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Не рендеримо нічого до hydration (запобігає hydration mismatch)
  if (!isClient) {
    return null;
  }

  // Якщо WebAuthn не підтримується
  if (!isWebAuthnSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="size-5" />
            Passkey (WebAuthn)
          </CardTitle>
          <CardDescription>Швидкий та безпечний вхід без пароля</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileAlert variant="warning">
            ⚠️ Ваш браузер не підтримує Passkey. Спробуйте оновити браузер або використати інший.
          </ProfileAlert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={hasPasskeys ? 'border-success/30' : 'border-warning/30'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="size-5" />
          Додати Passkey
        </CardTitle>
        <CardDescription>
          Увійдіть за допомогою{' '}
          {isPlatformAvailable ? 'Touch ID, Face ID або PIN-коду' : 'ключа безпеки'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info block */}
        <ProfileAlert variant="info" title="Що таке Passkey?">
          <p>
            Це найбезпечніший спосіб входу без пароля. Використовує{' '}
            {isPlatformAvailable ? 'біометрію' : 'ключ безпеки'} вашого пристрою.
          </p>
        </ProfileAlert>

        {/* Name input (optional) */}
        <div className="space-y-2">
          <Label htmlFor="passkey-name">
            Назва пристрою{' '}
            <span className="text-muted-foreground font-normal">(необовʼязково)</span>
          </Label>
          <Input
            id="passkey-name"
            placeholder="Безіменний passkey"
            value={passkeyName}
            onChange={(e) => setPasskeyName(e.target.value)}
            maxLength={100}
            disabled={isLoading}
          />
          <p className="text-muted-foreground text-xs">
            Допоможе розрізняти пристрої, наприклад: &quot;iPhone 15&quot; або &quot;YubiKey&quot;
          </p>
        </div>

        {/* Action button */}
        <Button onClick={handleAddPasskey} disabled={isLoading} size="sm">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Створення...
            </>
          ) : (
            <>
              {getAuthenticatorIcon(isPlatformAvailable ? 'platform' : 'cross-platform')} Додати
              Passkey
            </>
          )}
        </Button>

        {/* Platform authenticator hint */}
        {isPlatformAvailable && (
          <ProfileAlert variant="note">
            <p>
              <strong>💡 Підказка:</strong> Після натискання кнопки вас попросять використати
              біометрію або PIN-код цього пристрою
            </p>
          </ProfileAlert>
        )}
      </CardContent>
    </Card>
  );
}
