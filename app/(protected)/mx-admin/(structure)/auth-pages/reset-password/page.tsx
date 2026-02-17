import { ArrowLeft, Flower } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ResetPasswordPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/mx-admin/auth-pages">
              <ArrowLeft className="mr-2 size-4" />
              Назад
            </Link>
          </Button>
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Flower className="size-4" />
            </div>
            Maxsa SP
          </Link>
        </div>
        <Suspense
          fallback={
            <Card>
              <CardContent className="py-10 text-center">
                <div className="text-muted-foreground">Завантаження...</div>
              </CardContent>
            </Card>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
