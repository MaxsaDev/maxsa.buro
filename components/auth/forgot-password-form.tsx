'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';

import { forgotPasswordAction } from '@/actions/auth/forgot-password';
import { SubmitButton } from '@/components/auth/submit-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { MailIcon } from 'lucide-react';

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, null);

  // Показуємо toast повідомлення
  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Забули пароль?</CardTitle>
        <CardDescription>
          Введіть вашу email адресу і ми надішлемо вам інструкції для скидання паролю
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state?.success ? (
          <div className="space-y-4">
            <div className="bg-success/10 text-success-foreground rounded-md p-3 text-sm">
              {state.message}
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Повернутися до входу</Link>
            </Button>
          </div>
        ) : (
          <form action={formAction} autoComplete="off">
            <div className="grid gap-4">
              {/* Повідомлення про помилку */}
              {state?.message && !state.success && (
                <div className="bg-destructive/10 text-destructive-foreground rounded-md p-3 text-sm">
                  {state.message}
                </div>
              )}

              {/* Поле Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <InputGroup>
                  <InputGroupInput
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@gmail.com"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    data-1p-ignore="true"
                    data-lpignore="true"
                    autoFocus
                    required
                    aria-invalid={state?.errors?.email ? 'true' : 'false'}
                    aria-describedby={state?.errors?.email ? 'email-error' : undefined}
                  />
                  <InputGroupAddon>
                    <MailIcon />
                  </InputGroupAddon>
                </InputGroup>
                {/* {state?.errors?.email && (
                  <p id="email-error" className="text-sm text-red-600">
                    {state.errors.email[0]}
                  </p>
                )} */}
              </div>

              <SubmitButton className="w-full">Надіслати інструкції</SubmitButton>

              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">Повернутися до входу</Link>
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
