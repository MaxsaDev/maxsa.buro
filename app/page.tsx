import Link from 'next/link';

import { AppIcon } from '@/components/app-icon';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full max-w-md flex-col gap-6">
        {/* Лого */}
        <div className="flex items-center justify-center gap-2 font-medium">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md">
            <AppIcon className="size-5" />
          </div>
          <span className="text-2xl font-semibold">Maxsa Buro</span>
        </div>

        {/* Картка з кнопками навігації */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Аутентифікація Better Auth</CardTitle>
            <CardDescription>Демонстрація функціоналу аутентифікації</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {/* Публічні сторінки */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Публічні сторінки</h3>
                <div className="grid gap-2">
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/register">Реєстрація</Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/login">Вхід</Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/forgot-password">Забули пароль?</Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/verify-email">Верифікація email</Link>
                  </Button>
                </div>
              </div>

              {/* Захищені сторінки */}
              <div className="space-y-2 border-t pt-4">
                <h3 className="text-sm font-medium">Захищені сторінки</h3>
                <div className="grid gap-2">
                  <Button asChild className="justify-start">
                    <Link href="/mx-job">Робочий простір (користувач)</Link>
                  </Button>
                  <Button asChild className="justify-start">
                    <Link href="/profile">Профіль користувача</Link>
                  </Button>
                  <Button asChild variant="secondary" className="justify-start">
                    <Link href="/mx-admin">Адмін-панель</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Футер */}
        <p className="text-muted-foreground text-center text-xs">
          Powered by <span className="font-medium">Better Auth</span> + Next.js 16 + React 19
        </p>
      </div>
    </div>
  );
}
