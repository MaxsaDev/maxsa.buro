import { MailIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';

export function ForgotPasswordFormPreview() {
  return (
    <Card className="h-full transition-shadow group-hover:shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Забули пароль?</CardTitle>
        <CardDescription>
          Введіть вашу email адресу і ми надішлемо вам інструкції для скидання паролю
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="preview-forgot-email">Email</Label>
            <InputGroup>
              <InputGroupInput
                id="preview-forgot-email"
                name="email"
                type="email"
                placeholder="example@gmail.com"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                data-1p-ignore="true"
                data-lpignore="true"
                disabled
                defaultValue="example@gmail.com"
              />
              <InputGroupAddon>
                <MailIcon />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <Button type="button" className="w-full" disabled>
            Надіслати інструкції
          </Button>

          <Button variant="outline" className="w-full" disabled>
            Повернутися до входу
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
