import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Users } from 'lucide-react';

export default function Page() {
  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Клієнти</h1>
        <p className="text-muted-foreground mt-2">Список ваших клієнтів.</p>
      </div>

      <Empty>
        <EmptyMedia>
          <Users className="size-10" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Клієнтів в офісі ще немає</EmptyTitle>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
