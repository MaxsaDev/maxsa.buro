import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Users } from 'lucide-react';

export default function Page() {
  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Посадові особи</h1>
        <p className="text-muted-foreground mt-2">
          Список ваших юридичних осіб, що мають права підписувати звітні документи.
        </p>
      </div>

      <Empty>
        <EmptyMedia>
          <Users className="size-10" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>
            Юридичних осіб, що мають права підписувати звітні документи, ще немає
          </EmptyTitle>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
