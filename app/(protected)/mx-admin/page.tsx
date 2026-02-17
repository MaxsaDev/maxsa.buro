import { AlertCircle, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllUsers } from '@/data/auth/users';
import { getCurrentUser } from '@/lib/auth/auth-server';
import type { ExtendedUser } from '@/lib/auth/auth-types';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Перевіряємо авторизацію (додаткова перевірка для admin)
  const user = (await getCurrentUser()) as ExtendedUser | null;

  if (!user) {
    redirect('/login');
  }

  // Перевірка ролі адміністратора
  if (user.role !== 'admin') {
    redirect('/dashboard');
  }

  // Отримуємо всіх користувачів
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold">Адмін-панель</h1>
        <p className="text-muted-foreground mt-2">Управління системою та користувачами</p>
      </div>

      {/* Попередження про адмін права */}
      <Card className="border-warning/30 bg-warning/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="text-warning h-5 w-5" />
            <CardTitle className="text-warning">Адміністратор</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-warning text-sm">
            Ви увійшли як адміністратор. Будьте обережні при виконанні дій, що впливають на інших
            користувачів.
          </p>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всього користувачів</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-muted-foreground text-xs">Зареєстровано в системі</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Верифіковані</CardTitle>
            <Shield className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.emailVerified).length}</div>
            <p className="text-muted-foreground text-xs">Email підтверджено</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Адміністраторів</CardTitle>
            <Shield className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === 'admin').length}
            </div>
            <p className="text-muted-foreground text-xs">З правами адміністратора</p>
          </CardContent>
        </Card>
      </div>

      {/* Список користувачів */}
      <Card>
        <CardHeader>
          <CardTitle>Користувачі системи</CardTitle>
          <CardDescription>Список всіх зареєстрованих користувачів</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{u.name}</p>
                    {u.role === 'admin' && (
                      <span className="bg-info/15 text-info inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                        Адмін
                      </span>
                    )}
                    {u.isBanned && (
                      <span className="bg-destructive/15 text-destructive inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                        Заблоковано
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {u.emailVerified ? (
                    <span className="text-success text-sm">✓ Верифіковано</span>
                  ) : (
                    <span className="text-warning text-sm">Не верифіковано</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Дії */}
      <Card>
        <CardHeader>
          <CardTitle>Швидкі дії</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button asChild variant="outline">
              <Link href="/dashboard">Повернутися до Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/profile">Мій профіль</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
