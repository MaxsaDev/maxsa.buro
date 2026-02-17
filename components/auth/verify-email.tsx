import { Mail } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VerifyEmailProps {
  searchParams: Promise<{ email?: string }>;
}

async function VerifyEmailContent({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  // Отримуємо email з query параметрів
  const params = await searchParams;
  const email = params.email;

  if (!email) {
    return null;
  }

  return (
    <div className="bg-info/10 rounded-lg p-4 text-center">
      <p className="text-info text-sm">
        Лист відправлено на: <strong>{email}</strong>
      </p>
    </div>
  );
}

export function VerifyEmail({ searchParams }: VerifyEmailProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="bg-info/15 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
          <Mail className="text-info size-6" />
        </div>
        <CardTitle className="text-xl">Перевірте вашу пошту</CardTitle>
        <CardDescription>
          Ми відправили вам лист з посиланням для підтвердження email адреси
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={<div>Завантаження...</div>}>
          <VerifyEmailContent searchParams={searchParams} />
        </Suspense>

        <div className="space-y-4">
          <p className="text-muted-foreground text-center text-sm">
            Не отримали лист? Перевірте папку &quot;Спам&quot; або запитайте новий лист.
          </p>

          <div className="flex flex-col gap-2">
            <Button variant="outline" asChild>
              <Link href="/login">Повернутися до входу</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
