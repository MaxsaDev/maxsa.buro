import { EyeOff, MailIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';

export function LoginFormPreview() {
  return (
    <Card className="h-full transition-shadow group-hover:shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Вхід</CardTitle>
        <CardDescription>Увійдіть до свого акаунту</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="preview-email">Email (буде використовуватися, як логін)</Label>
            <InputGroup>
              <InputGroupInput
                id="preview-email"
                type="email"
                placeholder="example@gmail.com"
                disabled
                defaultValue="example@gmail.com"
              />
              <InputGroupAddon>
                <MailIcon />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="preview-password">Пароль</Label>
            </div>
            <InputGroup>
              <InputGroupInput
                id="preview-password"
                type="password"
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
            Увійти
          </Button>

          <Button type="button" variant="outline" className="w-full" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 size-5">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Увійти через Google
          </Button>

          <div className="text-center text-sm">
            Ще немає акаунту?{' '}
            <span className="text-muted-foreground underline underline-offset-4">
              Зареєструватися
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
