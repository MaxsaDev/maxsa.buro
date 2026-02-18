import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { UserCheck } from 'lucide-react';

export default function Page() {
  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Виконавці</h1>
        <p className="text-muted-foreground mt-2">Список ваших виконавців.</p>
      </div>

      <Empty>
        <EmptyMedia>
          <UserCheck className="size-10" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Виконавців в офісі ще немає</EmptyTitle>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
