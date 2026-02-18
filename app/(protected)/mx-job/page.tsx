'use client';

import { Home, Settings, User } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/lib/auth/user-context';

export default function MxJobPage() {
  // Отримуємо користувача з context (авторизація перевіряється в layout)
  const user = useUser();

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold">Робочий простір</h1>
        <p className="text-muted-foreground mt-2">
          Ласкаво просимо, <span className="font-medium">{user.name}</span>!
        </p>
      </div>

      {/* Статистика (заглушка) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активних сесій</CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-muted-foreground text-xs">Поточна сесія</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Роль</CardTitle>
            <Settings className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.role === 'admin' ? 'Адміністратор' : 'Користувач'}
            </div>
            <p className="text-muted-foreground text-xs">
              {user.role === 'admin' ? 'Повний доступ' : 'Стандартний доступ'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email підтверджено</CardTitle>
            <Home className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.emailVerified ? '✓' : '✗'}</div>
            <p className="text-muted-foreground text-xs">
              {user.emailVerified ? 'Верифіковано' : 'Не верифіковано'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Швидкі дії */}
      <Card>
        <CardHeader>
          <CardTitle>Швидкі дії</CardTitle>
          <CardDescription>Основні функції для управління вашим обліковим записом</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button asChild variant="outline" className="h-auto justify-start p-4">
              <Link href="/profile">
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Профіль</div>
                    <div className="text-muted-foreground text-sm">
                      Переглянути та редагувати профіль
                    </div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto justify-start p-4">
              <Link href="/profile#security">
                <div className="flex items-start gap-3">
                  <Settings className="mt-0.5 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Безпека</div>
                    <div className="text-muted-foreground text-sm">
                      Налаштування безпеки та паролю
                    </div>
                  </div>
                </div>
              </Link>
            </Button>

            {user.role === 'admin' && (
              <Button asChild variant="outline" className="h-auto justify-start p-4">
                <Link href="/mx-admin">
                  <div className="flex items-start gap-3">
                    <Home className="mt-0.5 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Адмін-панель</div>
                      <div className="text-muted-foreground text-sm">Управління системою</div>
                    </div>
                  </div>
                </Link>
              </Button>
            )}

            <Button asChild variant="outline" className="h-auto justify-start p-4">
              <Link href="/">
                <div className="flex items-start gap-3">
                  <Home className="mt-0.5 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Головна</div>
                    <div className="text-muted-foreground text-sm">
                      Повернутися на головну сторінку
                    </div>
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Інформація */}
      <Card>
        <CardHeader>
          <CardTitle>Інформація про систему</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Система аутентифікації:</strong> Better Auth v1.3.x
            </p>
            <p>
              <strong>Framework:</strong> Next.js 16 + React 19
            </p>
            <p>
              <strong>База даних:</strong> PostgreSQL 17 (Neon)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
