import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Coins } from 'lucide-react';

export default function Page() {
  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Каса</h1>
        <p className="text-muted-foreground mt-2">Список ваших касових операцій.</p>
      </div>

      <Empty>
        <EmptyMedia>
          <Coins className="size-10" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Касових операцій ще немає</EmptyTitle>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
