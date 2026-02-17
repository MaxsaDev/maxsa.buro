import { Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function VerifyEmailPreview() {
  return (
    <Card className="h-full transition-shadow group-hover:shadow-lg">
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
        <div className="bg-info/10 rounded-lg p-4 text-center">
          <p className="text-info text-sm">
            Лист відправлено на: <strong>example@gmail.com</strong>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground text-center text-sm">
            Не отримали лист? Перевірте папку &quot;Спам&quot; або запитайте новий лист.
          </p>

          <div className="flex flex-col gap-2">
            <Button variant="outline" disabled>
              Повернутися до входу
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
