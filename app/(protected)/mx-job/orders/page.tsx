import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { ShoppingCart } from 'lucide-react';

export default function Page() {
  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Замовлення</h1>
        <p className="text-muted-foreground mt-2">Список ваших замовлень.</p>
      </div>

      <Empty>
        <EmptyMedia>
          <ShoppingCart className="size-10" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Замовлень ще немає</EmptyTitle>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
