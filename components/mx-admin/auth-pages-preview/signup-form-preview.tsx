import { EyeOff, InfoIcon, MailIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function SignupFormPreview() {
  return (
    <Card className="h-full transition-shadow group-hover:shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Створення аккаунту</CardTitle>
        <CardDescription>Введіть вашу електронну пошту для створення аккаунту</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="preview-signup-email">Email (буде використовуватися, як логін)</Label>
            <InputGroup>
              <InputGroupInput
                id="preview-signup-email"
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

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="preview-signup-password">Пароль</Label>
              <InputGroup>
                <InputGroupInput
                  id="preview-signup-password"
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InputGroupButton variant="ghost" aria-label="Info" size="icon-xs" disabled>
                        <InfoIcon />
                      </InputGroupButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Мінімум 8 символів</p>
                    </TooltipContent>
                  </Tooltip>
                </InputGroupAddon>
              </InputGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="preview-signup-confirm">Підтвердження пароля</Label>
              <InputGroup>
                <InputGroupInput
                  id="preview-signup-confirm"
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InputGroupButton variant="ghost" aria-label="Info" size="icon-xs" disabled>
                        <InfoIcon />
                      </InputGroupButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Паролі мають збігатися</p>
                    </TooltipContent>
                  </Tooltip>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>

          <Button type="button" className="w-full" disabled>
            Створити аккаунт
          </Button>

          <div className="text-center text-sm">
            Вже маєте аккаунт?{' '}
            <span className="text-muted-foreground underline underline-offset-4">Вхід</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
