import { EyeOff, UnlockIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';

export function ResetPasswordFormPreview() {
  return (
    <Card className="h-full transition-shadow group-hover:shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Новий пароль</CardTitle>
        <CardDescription>Введіть ваш новий пароль нижче</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="preview-reset-password">Новий пароль</Label>
            <InputGroup>
              <InputGroupInput
                id="preview-reset-password"
                type="password"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-1p-ignore="true"
                data-lpignore="true"
                disabled
                defaultValue="••••••••"
              />
              <InputGroupAddon>
                <UnlockIcon />
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" variant="ghost" disabled type="button">
                  <EyeOff className="size-4" />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="preview-reset-confirm">Підтвердіть пароль</Label>
            <InputGroup>
              <InputGroupAddon>
                <UnlockIcon />
              </InputGroupAddon>
              <InputGroupInput
                id="preview-reset-confirm"
                type="password"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-1p-ignore="true"
                data-lpignore="true"
                disabled
                defaultValue="••••••••"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" variant="ghost" disabled type="button">
                  <EyeOff className="size-4" />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>

          <Button type="button" className="w-full" disabled>
            Змінити пароль
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
